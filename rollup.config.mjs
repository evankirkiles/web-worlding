import pkg from './package.json' assert { type: 'json' };
import rollupReplace from '@rollup/plugin-replace';
import rollupTypescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from 'typescript';

const license = `/*!
 * ${pkg.name}
 * https://github.com/${pkg.repository}
 * (c) 2022 @evankirkiles
 * Released under the MIT License.
 */`;

// const onwarn = (warning, warn) => {
//   // Silence circular dependency warning for moment package
//   if (warning.code === 'CIRCULAR_DEPENDENCY') {
//     return;
//   }
//   warn(`(!) ${warning.message}`);
// };

export default {
  input: 'src/index.ts',
  external: ['three'],
  output: [
    {
      format: 'umd',
      name: 'WebWorlding',
      file: pkg.main,
      banner: license,
      indent: '\t',
      globals: {
        three: 'THREE',
      },
    },
    {
      format: 'es',
      file: pkg.module,
      banner: license,
      indent: '\t',
      globals: {
        three: 'THREE',
      },
    },
  ],
  plugins: [
    rollupReplace({ preventAssignment: true, __VERSION: pkg.version }),
    rollupTypescript({ typescript }),
    nodeResolve(),
  ],
  // onwarn,
};
