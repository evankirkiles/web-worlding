/*
 * World.ts
 * author: evan kirkiles
 * created on Fri Jun 24 2022
 * 2022 the player space,
 * INSPIRATION: https://github.com/swift502/Sketchbook
 * so so so so so much credit and admiration to the guys who built Sketchbook.
 * incredible work. this would not have been possible without their contributions.
 */
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { GLTF } from 'three-stdlib/loaders/GLTFLoader';
import { CameraOperator } from '../core/CameraOperator';
import * as Utils from '../core/FunctionLibrary';
import { InputManager } from '../input/InputManager';
import { LoadingManager } from '../core/LoadingManager';
import { CollisionGroups } from '../enums/CollisionGroups';
import { IUpdatable } from '../interfaces/IUpdatable';
import { IWorldEntity } from '../interfaces/IWorldEntity';
import { Player } from '../players/Player';
import { BoxCollider } from '../physics/colliders/BoxCollider';
import { Scenario } from './Scenario';
import { IInteractable } from '../interfaces/IInteractable';
// Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

type WorldConfig = {
  forceTouchScreen?: boolean;
  pixelRatio?: number;
  characters?: Record<string, string>;
};

export class World {
  // game properties
  public renderer: THREE.WebGLRenderer;
  public camera: THREE.PerspectiveCamera;
  public cameraOperator: CameraOperator;
  public playerModelPath: string;

  // world assets
  public graphicsWorld: THREE.Scene;
  public raycastScene: THREE.Mesh[] = [];
  public physicsWorld: CANNON.World;

  // render loop
  public clock: THREE.Clock;
  public renderDelta: number;
  public logicDelta: number;
  public sinceLastFrame: number;
  public requestDelta!: number;
  public justRendered: boolean;
  public timeScaleTarget = 1;
  public timeScale = 1;

  // physics
  public physicsFrameRate: number;
  public physicsFrameTime: number;
  public physicsMaxPrediction: number;

  // game entities
  public players: Player[] = [];
  public interactables: IInteractable[] = [];
  public updatables: IUpdatable[] = [];
  public scenarios: Scenario[] = [];

  // custom elements
  public inputManager: InputManager;
  public loadingManager: LoadingManager;

  // scenarios
  public lastScenarioID?: string;

  // html target
  public target: HTMLDivElement;

  // configuration
  public config: WorldConfig;

  // debugger
  public debugger?: ReturnType<typeof CannonDebugger>;
  private debug = false;

  // listeners, so can remove once component exits
  private listeners: { [key: string]: (() => void)[] } = {};

  /**
   * Construct a Player THREE.js world into the canvas!
   * @param target The div element to draw the scene into
   */
  constructor(
    target: HTMLDivElement,
    playerModelPath: string,
    worldScenePath?: string,
    callbacks: {
      onDownloadStart?: () => void;
      onDownloadProgress?: (p: number, d: number, t: number) => void;
      onDownloadFinish?: () => void;
    } = {},
    config: WorldConfig = {
      forceTouchScreen: false,
    },
  ) {
    this.target = target;
    this.config = config;

    // initialize Renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    if (config.pixelRatio) this.renderer.setPixelRatio(config.pixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // initialization
    this.inputManager = new InputManager(this, this.target, this.config.forceTouchScreen);
    this.loadingManager = new LoadingManager(this, {
      onStart: callbacks.onDownloadStart,
      onProgress: callbacks.onDownloadProgress,
      onFinished: callbacks.onDownloadFinish,
    });

    // set up resizing on window size change
    const onWindowResize = () => {
      // get the size of the canvas for aspect ratio
      const { width, height } = target.getBoundingClientRect();
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height, false);
    };
    this.listeners.resize = [onWindowResize];
    window.addEventListener('resize', onWindowResize, false);

    // THREE.js scene
    this.graphicsWorld = new THREE.Scene();
    const { width, height } = target.getBoundingClientRect();
    this.camera = new THREE.PerspectiveCamera(80, width / height, 0.1, 1010);
    this.cameraOperator = new CameraOperator(this, this.camera, this.renderer.domElement, this.inputManager);
    this.cameraOperator.minDistance = 1;
    this.cameraOperator.maxDistance = 20;
    onWindowResize();

    // physics
    this.physicsWorld = new CANNON.World();
    this.physicsWorld.gravity.set(0, -9.81, 0);
    this.physicsWorld.broadphase = new CANNON.SAPBroadphase(this.physicsWorld);
    this.physicsWorld.solver = new CANNON.GSSolver();
    (this.physicsWorld.solver as CANNON.GSSolver).iterations = 10;
    this.physicsWorld.allowSleep = true;

    this.physicsFrameRate = 60;
    this.physicsFrameTime = 1 / this.physicsFrameRate;
    this.physicsMaxPrediction = this.physicsFrameRate;

    // render loop
    this.clock = new THREE.Clock();
    this.renderDelta = 0;
    this.logicDelta = 0;
    this.sinceLastFrame = 0;
    this.justRendered = false;

    // save reference to location of player model
    this.playerModelPath = playerModelPath;

    // load scene if path is supplied
    if (worldScenePath) {
      this.openScene(worldScenePath).then(() => {
        // begin render cycle once loaded
        this.render(this);
      });
    }

    // create the cannon debugger
    if (this.debug) {
      this.debugger = CannonDebugger(this.graphicsWorld, this.physicsWorld, {});
    }

    // connect the canvas up
    this.target.appendChild(this.renderer.domElement);
  }

  /**
   * Destroy the three.js instance, disposing of assets and removing the window
   * event listeners.
   */
  destroy() {
    this.target.removeChild(this.renderer.domElement);
    // remove input listener
    this.inputManager.deafen();
    // remove event listeners from window
    Object.keys(this.listeners).forEach((key) => {
      this.listeners[key].forEach((listener) => {
        window.removeEventListener(key, listener, false);
      });
    });
  }

  /* -------------------------------- UPDATING -------------------------------- */

  /**
   * Draws the world as seen through the camera.
   * @param world The world (this) to render
   */
  public render(world: World): void {
    this.requestDelta = this.clock.getDelta();
    requestAnimationFrame(() => {
      world.render(world);
    });

    // get the timestep
    const unscaledTimeStep = this.requestDelta + this.renderDelta + this.logicDelta;
    let timeStep = unscaledTimeStep * this.timeScale;
    timeStep = Math.min(timeStep, 1 / 30); // min 30 fps

    // logic
    world.update(timeStep, unscaledTimeStep);

    // measuring logic time
    this.logicDelta = this.clock.getDelta();

    // frame limiting
    const interval = 1 / 60;
    this.sinceLastFrame += this.requestDelta + this.renderDelta + this.logicDelta;
    this.sinceLastFrame %= interval;

    // render the world
    this.renderer.render(this.graphicsWorld, this.camera);
    this.renderDelta = this.clock.getDelta();
  }

  /**
   * Updates the world and physics
   * @param timeStep
   */
  public update(timeStep: number, unscaledTimeStep: number): void {
    this.updatePhysics(timeStep);
    if (this.debug && this.debugger) {
      this.debugger.update();
    }
    // update registered objects
    this.updatables.forEach((entity) => {
      entity.update(timeStep, unscaledTimeStep);
    });
    // update camera
    this.cameraOperator.update2(timeStep);

    // Lerp time scale
    this.timeScale = THREE.MathUtils.lerp(this.timeScale, this.timeScaleTarget, 0.2);
  }

  /**
   * Updates the physics in the world
   * @param timeStep Time step to use in calculations
   */
  public updatePhysics(timeStep: number): void {
    // step the physics world
    this.physicsWorld.step(this.physicsFrameTime, timeStep);
    // do other physics updates (respawns ?) here
    // this.players.forEach((player) => {
    // 	if (this.isOutOfBounds(player.playerCapsule.body.position))
    // 	{
    // 		this.outOfBoundsRespawn(player.playerCapsule.body);
    // 	}
    // });
  }

  /* ---------------------------- STATE MANAGEMENT ---------------------------- */

  /**
   * Registers an entity for updates in the update cycle in this world.
   * @param registree The entity to update every timestep
   */
  public registerUpdatable(registree: IUpdatable) {
    this.updatables.push(registree);
    this.updatables.sort((a, b) => (a.updateOrder > b.updateOrder ? 1 : -1));
  }

  /**
   * Unregisters an entity for updates from this world.
   * @param registree The entity to remove from the update loop
   */
  public unregisterUpdatable(registree: IUpdatable) {
    this.updatables = this.updatables.filter((updatable) => updatable !== registree);
  }

  /**
   * Adds an entity to the world
   * @param worldEntity The entity to add to the world
   */
  public add(worldEntity: IWorldEntity): void {
    worldEntity.addToWorld(this);
    this.registerUpdatable(worldEntity);
  }

  /**
   * Removes an entity from the world
   * @param worldEntity The entity to remove from the world
   */
  public remove(worldEntity: IWorldEntity): void {
    worldEntity.removeFromWorld(this);
    this.unregisterUpdatable(worldEntity);
  }

  /**
   * Clears all entities from the world
   */
  public clearEntities(): void {
    for (let i = 0; i < this.players.length; i += 1) {
      this.remove(this.players[i]);
      i -= 1;
    }
  }

  /**
   * Update the world's timescale to LERP towards this value of update speed.
   * @param val
   */
  public setTimeScale(val: number) {
    this.timeScaleTarget = val;
  }

  /* ------------------------------ SCENE LOADING ----------------------------- */

  /**
   * Begins the download of a scene.
   */
  public async openScene(world: string): Promise<void> {
    const sceneGLTF = await this.loadingManager.loadGLTF(world);
    await this.loadScene(sceneGLTF);
    this.update(1, 1);
    this.setTimeScale(1);
  }

  /**
   * Load in a scene from a GLB file. Each scene contains (in userData):
   *  - A scenario defining where users can spawn / actions
   *  - Meshes for visualization and rendering
   *  - Collision / physics data
   *  - Paths for AI
   * @param loadingManager
   */
  public async loadScene(gltf: GLTF) {
    // traverse the scene to populate the world
    this.raycastScene = [];
    gltf.scene.traverse((child) => {
      if (Object.prototype.hasOwnProperty.call(child, 'userData')) {
        // for mesh children, update materials
        if (child.type === 'Mesh') {
          Utils.setUpMeshProperties(child as THREE.Mesh);
          (child as THREE.Mesh).geometry.computeBoundsTree();
          // this.cameraController.colliderMeshes.push(child);
          // this.raycastScene.push(child as THREE.Mesh);
        }
        // check if the child has physics data
        if (Object.prototype.hasOwnProperty.call(child.userData, 'data')) {
          switch (child.userData.data) {
            // userData: PHYSICS
            case 'physics':
              if (Object.prototype.hasOwnProperty.call(child.userData, 'type')) {
                // import box colliders from blender data and apply
                if (child.userData.type === 'box') {
                  const phys = new BoxCollider({
                    size: new CANNON.Vec3(child.scale.x, child.scale.y, child.scale.z),
                  });
                  phys.body.position.copy(Utils.cannonVector(child.position));
                  phys.body.quaternion.copy(Utils.cannonQuat(child.quaternion));
                  phys.body.updateAABB();
                  phys.body.shapes.forEach((shape) => {
                    shape.collisionFilterMask = ~CollisionGroups.TriMeshColliders; // eslint-disable-line no-bitwise
                  });
                  this.physicsWorld.addBody(phys.body);
                }
                // hide the physics mesh
                child.visible = false;
              }
              break;
            // userData: SCENARIO
            case 'scenario':
              this.scenarios.push(new Scenario(child, this));
              break;
            default:
              break;
          }
        }
      }
    });

    // add the scene to the world
    this.graphicsWorld.add(gltf.scene);

    // add a light to the scene
    this.graphicsWorld.add(new THREE.AmbientLight(0xd0d0d0));
    this.graphicsWorld.add(new THREE.HemisphereLight('#e6e1b8', '#595850', 0.5));
    // this.graphicsWorld.add(new THREE.HemisphereLight('#66B588', '#0D85AA'));

    // find default scenario
    let defaultScenarioID: string | null = null;
    for (let i = 0; i < this.scenarios.length; i += 1) {
      if (this.scenarios[i].default) {
        defaultScenarioID = this.scenarios[i].id;
        break;
      }
    }
    // launch default scenario
    if (defaultScenarioID) await this.launchScenario(defaultScenarioID);
  }

  /**
   * Launches a scenario into the world, essentially spawning the player at the
   * scenario position.
   * @param scenarioID The ID of the scenario (from the name in the file)
   * @param loadingManager The loading manager that downloaded it
   */
  public async launchScenario(scenarioID: string) {
    this.lastScenarioID = scenarioID;
    this.clearEntities();
    // launch the scenario that matches by id
    const scenarioPromises: Promise<void>[] = [];
    for (let i = 0; i < this.scenarios.length; i += 1) {
      if (this.scenarios[i].id === scenarioID || this.scenarios[i].spawnAlways) {
        scenarioPromises.push(this.scenarios[i].launch(this));
      }
    }
    await Promise.all(scenarioPromises);
  }
}
