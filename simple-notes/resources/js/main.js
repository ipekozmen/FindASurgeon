// Basit Not Defteri - Neutralinojs desktop text editor
// Supports: any file type text saving, bold/italic/header formatting,
// undo/redo, autosave, keyboard shortcuts, tab-as-indent, image insertion.

const errorBanner = document.getElementById('error-banner');

function showBanner(text) {
    errorBanner.textContent = text;
    errorBanner.classList.add('show');
}

window.addEventListener('error', (e) => {
    showBanner('JS hatası: ' + (e.message || e.error || e));
});
window.addEventListener('unhandledrejection', (e) => {
    showBanner('Promise hatası: ' + (e.reason && (e.reason.message || JSON.stringify(e.reason))));
});

try {
    Neutralino.init();
    showBanner('');
    errorBanner.classList.remove('show');
} catch (e) {
    showBanner('Neutralino.init() başarısız: ' + e);
}

const editor = document.getElementById('editor');
const filenameEl = document.getElementById('filename');
const dirtyEl = document.getElementById('dirty-indicator');
const saveStatusEl = document.getElementById('save-status');
const blockTypeSelect = document.getElementById('block-type');

let currentPath = null;   // null = unsaved new document
let isDirty = false;
let autosaveTimer = null;
const AUTOSAVE_DELAY_MS = 1500;

editor.innerHTML = '<p><br></p>';
editor.focus();

function setDirty(v) {
    isDirty = v;
    dirtyEl.classList.toggle('dirty', v);
    if (v) scheduleAutosave();
}

function updateFilenameLabel() {
    filenameEl.textContent = currentPath
        ? currentPath.split(/[\\/]/).pop()
        : 'Adsız';
}

function scheduleAutosave() {
    if (!currentPath) return; // only autosave files that already have a path
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(saveFile, AUTOSAVE_DELAY_MS);
}

// ---------- File operations ----------

function contentForSave() {
    // HTML files keep full rich formatting; anything else is saved as plain text.
    if (currentPath && /\.html?$/i.test(currentPath)) {
        return editor.innerHTML;
    }
    return editor.innerText;
}

function reportError(context, e) {
    const msg = (e && (e.message || e.code || JSON.stringify(e))) || String(e);
    flashSaveStatus(`${context}: ${msg}`);
    showBanner(`${context}: ${msg}`);
    console.error(context, e);
}

async function saveFile() {
    if (!currentPath) {
        return saveFileAs();
    }
    try {
        await Neutralino.filesystem.writeFile(currentPath, contentForSave());
        setDirty(false);
        flashSaveStatus('Kaydedildi');
    } catch (e) {
        reportError('Kaydetme hatası', e);
    }
}

async function saveFileAs() {
    try {
        const path = await Neutralino.os.showSaveDialog('Kaydet', {
            defaultPath: currentPath || 'Adsız.txt'
        });
        if (!path) return;
        currentPath = path;
        updateFilenameLabel();
        await Neutralino.filesystem.writeFile(currentPath, contentForSave());
        setDirty(false);
        flashSaveStatus('Kaydedildi');
    } catch (e) {
        reportError('Farklı kaydetme hatası', e);
    }
}

async function openFile() {
    try {
        const entries = await Neutralino.os.showOpenDialog('Aç', { multiSelections: false });
        if (!entries || entries.length === 0) return;
        const path = entries[0];
        const data = await Neutralino.filesystem.readFile(path);
        currentPath = path;
        updateFilenameLabel();
        if (/\.html?$/i.test(path)) {
            editor.innerHTML = data;
        } else {
            editor.innerHTML = '';
            data.split('\n').forEach(line => {
                const p = document.createElement('p');
                p.textContent = line.length ? line : '​';
                editor.appendChild(p);
            });
            if (!editor.firstChild) editor.innerHTML = '<p><br></p>';
        }
        setDirty(false);
        flashSaveStatus('Açıldı');
        pushHistory();
    } catch (e) {
        reportError('Açma hatası', e);
    }
}

async function newFile() {
    if (isDirty) {
        try {
            const choice = await Neutralino.os.showMessageBox(
                'Yeni belge',
                'Kaydedilmemiş değişiklikler var. Yeni belge oluşturulsun mu?',
                'YES_NO',
                'QUESTION'
            );
            if (choice !== 'YES') return;
        } catch (e) {
            reportError('Onay penceresi hatası', e);
            return;
        }
    }
    currentPath = null;
    editor.innerHTML = '<p><br></p>';
    updateFilenameLabel();
    setDirty(false);
    resetHistory();
    editor.focus();
    flashSaveStatus('Yeni belge');
}

let saveStatusTimer = null;
function flashSaveStatus(text) {
    saveStatusEl.textContent = text;
    clearTimeout(saveStatusTimer);
    saveStatusTimer = setTimeout(() => (saveStatusEl.textContent = ''), 1800);
}

// ---------- Undo / redo (custom stack, content-level) ----------

let undoStack = [];
let redoStack = [];
let historyTimer = null;

function resetHistory() {
    undoStack = [editor.innerHTML];
    redoStack = [];
}

function pushHistory() {
    clearTimeout(historyTimer);
    historyTimer = setTimeout(() => {
        const snapshot = editor.innerHTML;
        if (undoStack[undoStack.length - 1] !== snapshot) {
            undoStack.push(snapshot);
            redoStack = [];
        }
    }, 300);
}

function undo() {
    if (undoStack.length <= 1) return;
    redoStack.push(undoStack.pop());
    editor.innerHTML = undoStack[undoStack.length - 1];
    setDirty(true);
}

function redo() {
    if (redoStack.length === 0) return;
    const snapshot = redoStack.pop();
    undoStack.push(snapshot);
    editor.innerHTML = snapshot;
    setDirty(true);
}

resetHistory();

// ---------- Formatting ----------

function applyBlock(tag) {
    document.execCommand('formatBlock', false, tag);
    editor.focus();
}

function toggleBold() {
    document.execCommand('bold');
    editor.focus();
}

function toggleItalic() {
    document.execCommand('italic');
    editor.focus();
}

const IMAGE_MIME_BY_EXT = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp'
};

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

async function insertImage() {
    try {
        const path = await Neutralino.os.showOpenDialog('Resim seç', {
            multiSelections: false,
            filters: [{ name: 'Resimler', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'] }]
        });
        if (!path || path.length === 0) return;
        const filePath = path[0];
        const ext = (filePath.split('.').pop() || '').toLowerCase();
        const mime = IMAGE_MIME_BY_EXT[ext] || 'application/octet-stream';
        const buffer = await Neutralino.filesystem.readBinaryFile(filePath);
        const dataUrl = `data:${mime};base64,${arrayBufferToBase64(buffer)}`;

        editor.focus();
        const ok = document.execCommand('insertImage', false, dataUrl);
        if (!ok) {
            const img = document.createElement('img');
            img.src = dataUrl;
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(img);
            } else {
                editor.appendChild(img);
            }
        }
        setDirty(true);
        pushHistory();
    } catch (e) {
        reportError('Resim ekleme hatası', e);
    }
}

// ---------- Tab key: indent instead of moving focus ----------

editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertText', false, '	');
    }
});

// ---------- Input tracking ----------

editor.addEventListener('input', () => {
    setDirty(true);
    pushHistory();
});

// ---------- Toolbar bindings ----------

document.getElementById('btn-new').addEventListener('click', newFile);
document.getElementById('btn-open').addEventListener('click', openFile);
document.getElementById('btn-save').addEventListener('click', saveFile);
document.getElementById('btn-undo').addEventListener('click', undo);
document.getElementById('btn-redo').addEventListener('click', redo);
document.getElementById('btn-bold').addEventListener('click', toggleBold);
document.getElementById('btn-italic').addEventListener('click', toggleItalic);
document.getElementById('btn-image').addEventListener('click', insertImage);

blockTypeSelect.addEventListener('change', (e) => applyBlock(e.target.value));

// ---------- Keyboard shortcuts ----------

window.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;

    switch (e.key.toLowerCase()) {
        case 's':
            e.preventDefault();
            e.shiftKey ? saveFileAs() : saveFile();
            break;
        case 'o':
            e.preventDefault();
            openFile();
            break;
        case 'n':
            e.preventDefault();
            newFile();
            break;
        case 'b':
            e.preventDefault();
            toggleBold();
            break;
        case 'i':
            e.preventDefault();
            toggleItalic();
            break;
        case 'z':
            e.preventDefault();
            e.shiftKey ? redo() : undo();
            break;
        case 'y':
            e.preventDefault();
            redo();
            break;
    }
});

// ---------- Window close ----------

Neutralino.events.on('windowClose', async () => {
    if (isDirty) {
        clearTimeout(autosaveTimer);
        await saveFile();
    }
    Neutralino.app.exit();
});

updateFilenameLabel();
