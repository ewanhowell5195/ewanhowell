let wasm;

const cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8Memory0;
function getUint8Memory0() {
    if (cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function getObject(idx) { return heap[idx]; }

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let WASM_VECTOR_LEN = 0;

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1);
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedInt32Memory0;
function getInt32Memory0() {
    if (cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

function getArrayU8FromWasm0(ptr, len) {
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}
/**
* No error reporting included. To get the detailed error code, use `BrotliDecStream`.
* @param {Uint8Array} input
* @returns {Uint8Array}
*/
export function brotliDec(input) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(input, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.brotliDec(retptr, ptr0, len0);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var r2 = getInt32Memory0()[retptr / 4 + 2];
        var r3 = getInt32Memory0()[retptr / 4 + 3];
        if (r3) {
            throw takeObject(r2);
        }
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 1);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

const cachedTextEncoder = new TextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}
/**
*/
export const BrotliDecStreamResult = Object.freeze({
/**
* The stream is just inited and have not been runned.
* `BrotliResult` uses `ResultFailure = 0`, but as we will convert `ResultFailure` to a negative actual error code,
* 0 is reused as no input currently.
*/
Init:0,"0":"Init",ResultSuccess:1,"1":"ResultSuccess",NeedsMoreInput:2,"2":"NeedsMoreInput",NeedsMoreOutput:3,"3":"NeedsMoreOutput", });
/**
* Copied and modified from enum BrotliDecoderErrorCode of dropbox/rust-brotli-decompressor.
* It is not PascalCase but kept in MACRO_CASE because changing all names is too troublesome.
* And most of the time you may not need to care about the error code.
* NOTICE: All numbers are reversed to positive, required by wasm_bindgen.
*/
export const BrotliDecStreamErrCode = Object.freeze({ BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_NIBBLE:1,"1":"BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_NIBBLE",BROTLI_DECODER_ERROR_FORMAT_RESERVED:2,"2":"BROTLI_DECODER_ERROR_FORMAT_RESERVED",BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_META_NIBBLE:3,"3":"BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_META_NIBBLE",BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_ALPHABET:4,"4":"BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_ALPHABET",BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_SAME:5,"5":"BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_SAME",BROTLI_DECODER_ERROR_FORMAT_CL_SPACE:6,"6":"BROTLI_DECODER_ERROR_FORMAT_CL_SPACE",BROTLI_DECODER_ERROR_FORMAT_HUFFMAN_SPACE:7,"7":"BROTLI_DECODER_ERROR_FORMAT_HUFFMAN_SPACE",BROTLI_DECODER_ERROR_FORMAT_CONTEXT_MAP_REPEAT:8,"8":"BROTLI_DECODER_ERROR_FORMAT_CONTEXT_MAP_REPEAT",BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_1:9,"9":"BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_1",BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_2:10,"10":"BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_2",BROTLI_DECODER_ERROR_FORMAT_TRANSFORM:11,"11":"BROTLI_DECODER_ERROR_FORMAT_TRANSFORM",BROTLI_DECODER_ERROR_FORMAT_DICTIONARY:12,"12":"BROTLI_DECODER_ERROR_FORMAT_DICTIONARY",BROTLI_DECODER_ERROR_FORMAT_WINDOW_BITS:13,"13":"BROTLI_DECODER_ERROR_FORMAT_WINDOW_BITS",BROTLI_DECODER_ERROR_FORMAT_PADDING_1:14,"14":"BROTLI_DECODER_ERROR_FORMAT_PADDING_1",BROTLI_DECODER_ERROR_FORMAT_PADDING_2:15,"15":"BROTLI_DECODER_ERROR_FORMAT_PADDING_2",BROTLI_DECODER_ERROR_FORMAT_DISTANCE:16,"16":"BROTLI_DECODER_ERROR_FORMAT_DISTANCE",BROTLI_DECODER_ERROR_DICTIONARY_NOT_SET:19,"19":"BROTLI_DECODER_ERROR_DICTIONARY_NOT_SET",BROTLI_DECODER_ERROR_INVALID_ARGUMENTS:20,"20":"BROTLI_DECODER_ERROR_INVALID_ARGUMENTS",BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MODES:21,"21":"BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MODES",BROTLI_DECODER_ERROR_ALLOC_TREE_GROUPS:22,"22":"BROTLI_DECODER_ERROR_ALLOC_TREE_GROUPS",BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MAP:25,"25":"BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MAP",BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_1:26,"26":"BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_1",BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_2:27,"27":"BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_2",BROTLI_DECODER_ERROR_ALLOC_BLOCK_TYPE_TREES:30,"30":"BROTLI_DECODER_ERROR_ALLOC_BLOCK_TYPE_TREES",BROTLI_DECODER_ERROR_UNREACHABLE:31,"31":"BROTLI_DECODER_ERROR_UNREACHABLE", });
/**
*/
export class BrotliDecStream {

    static __wrap(ptr) {
        const obj = Object.create(BrotliDecStream.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_brotlidecstream_free(ptr);
    }
    /**
    */
    constructor() {
        const ret = wasm.brotlidecstream_new();
        return BrotliDecStream.__wrap(ret);
    }
    /**
    * @param {Uint8Array} input
    * @param {number} output_size
    * @returns {Uint8Array}
    */
    dec(input, output_size) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(input, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.brotlidecstream_dec(retptr, this.ptr, ptr0, len0, output_size);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @returns {number}
    */
    totalOut() {
        const ret = wasm.brotlidecstream_totalOut(this.ptr);
        return ret >>> 0;
    }
    /**
    * @returns {number}
    */
    result() {
        const ret = wasm.brotlidecstream_result(this.ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    lastInputOffset() {
        const ret = wasm.brotlidecstream_lastInputOffset(this.ptr);
        return ret >>> 0;
    }
}

async function load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function getImports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_693216e109162396 = function() {
        const ret = new Error();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_stack_0ddaca5d1abfb52f = function(arg0, arg1) {
        const ret = getObject(arg1).stack;
        const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_error_09919627ac0992f5 = function(arg0, arg1) {
        try {
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_free(arg0, arg1);
        }
    };
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    return imports;
}

function initMemory(imports, maybe_memory) {

}

function finalizeInit(instance, module) {
    wasm = instance.exports;
    init.__wbindgen_wasm_module = module;
    cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);


    return wasm;
}

function initSync(bytes) {
    const imports = getImports();

    initMemory(imports);

    const module = new WebAssembly.Module(bytes);
    const instance = new WebAssembly.Instance(module, imports);

    return finalizeInit(instance, module);
}

async function init(input) {
    if (typeof input === 'undefined') {
        input = new URL('index_bg.wasm', import.meta.url);
    }
    const imports = getImports();

    if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }

    initMemory(imports);

    const { instance, module } = await load(await input, imports);

    return finalizeInit(instance, module);
}

export { initSync }
export default init;
