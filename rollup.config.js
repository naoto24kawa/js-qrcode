import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default [
  {
    input: 'src/index.js',
    output: [
      {
        file: 'dist/js-qrcode.js',
        format: 'umd',
        name: 'QRCode',
        exports: 'named'
      },
      {
        file: 'dist/js-qrcode.min.js',
        format: 'umd',
        name: 'QRCode',
        exports: 'named',
        plugins: [terser()]
      },
      {
        file: 'dist/js-qrcode.esm.js',
        format: 'es'
      }
    ],
    plugins: [
      nodeResolve(),
      commonjs()
    ]
  }
];