// ES Module wrapper for CommonJS upload handler
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const uploadHandler = require('./upload-handler.cjs');

export default uploadHandler;