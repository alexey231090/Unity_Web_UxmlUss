document.addEventListener('DOMContentLoaded', () => {

    // --- ДАННЫЕ ---
    let selectedBlock = null;

    // 1. ОЧИЩЕННАЯ БАЗА (Только пустые темы)
    const ussDatabase = {
        "default": {}, // Пусто! Начинаем с нуля.
        "dark": {}
    };

    // Свойства Unity для выпадающего списка
    const unityProperties = [
        "width", "height", "min-width", "min-height", "max-width", "max-height",
        "margin", "margin-left", "margin-top", "margin-right", "margin-bottom",
        "padding", "padding-left", "padding-top", "padding-right", "padding-bottom",
        "background-color", "color",
        "border-width", "border-color", "border-radius",
        "font-size", "-unity-font-style", "-unity-text-align",
        "flex-direction", "align-items", "justify-content", "flex-wrap", "flex-grow",
        "opacity", "display", "position", "left", "top", "right", "bottom"
    ];

    let currentTheme = "default";

    // UI ссылки
    const rootCanvas = document.getElementById('root-canvas');
    const modalAdd = document.getElementById('modal-add');
    const ussListContainer = document.getElementById('uss-list');
    const gameView = document.getElementById('game-view');

    // --- ЛОГИКА ТАБОВ ---
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('main > section');

    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            navItems.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            views.forEach(v => {
                v.classList.remove('active-view');
                v.classList.add('hidden-view');
            });

            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden-view');
            document.getElementById(targetId).classList.add('active-view');

            if (targetId === 'view-uss') renderUSS();
            if (targetId === 'view-preview') generatePreview();
        });
    });

    // --- ЛОГИКА БЛОКОВ (UXML) ---
    rootCanvas.addEventListener('click', (e) => {
        if(e.target === rootCanvas) deselectAll();
    });

    function deselectAll() {
        if(selectedBlock) selectedBlock.classList.remove('selected');
        selectedBlock = null;
    }

    function selectBlock(block) {
        deselectAll();
        selectedBlock = block;
        selectedBlock.classList.add('selected');
    }

    // --- МОДАЛКА И ДОБАВЛЕНИЕ ---
    const fabAdd = document.getElementById('fab-add');
    const modalClose = document.getElementById('modal-close');
    const elementOptions = document.querySelectorAll('.el-option');

    fabAdd.addEventListener('click', () => modalAdd.classList.remove('hidden'));
    modalClose.addEventListener('click', () => modalAdd.classList.add('hidden'));

    elementOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            createBlock(opt.getAttribute('data-type'));
            modalAdd.classList.add('hidden');
        });
    });

    function createBlock(type) {
        const div = document.createElement('div');
        div.className = 'scratch-block';
        div.dataset.type = type;

        let inputsHTML = `<input type="text" class="class-input uxml-class" placeholder="class...">`;
        if (type === 'Button' || type === 'Label') {
            inputsHTML += `<input type="text" class="text-input uxml-text" placeholder="text" style="width:50px; margin-left:5px;">`;
        }

        div.innerHTML = `
            <div class="block-header">
                <div style="display:flex; align-items:center; gap:5px; flex-wrap:wrap;">
                    <span class="block-type">${type}</span>
                    ${inputsHTML}
                </div>
                <button class="btn-delete">✕</button>
            </div>
            <div class="block-children"></div>
        `;

        // Обработчики
        div.addEventListener('click', (e) => {
            if(e.target.tagName === 'INPUT' || e.target.classList.contains('btn-delete')) return;
            e.stopPropagation();
            selectBlock(div);
        });

        div.querySelector('.btn-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            if(confirm('Удалить блок?')) {
                div.remove();
                if(selectedBlock === div) selectedBlock = null;
            }
        });

        if (selectedBlock) {
            const container = selectedBlock.querySelector('.block-children');
            if(container) container.appendChild(div);
        } else {
            rootCanvas.appendChild(div);
        }
    }

    // --- USS EDITOR ---
    const btnAddClass = document.getElementById('btn-add-class');
    const inputNewClass = document.getElementById('new-class-name');
    const themeSelector = document.getElementById('uss-file-selector');

    themeSelector.addEventListener('change', (e) => {
        currentTheme = e.target.value;
        renderUSS();
    });

    btnAddClass.addEventListener('click', () => {
        const rawName = inputNewClass.value.trim();
        if (!rawName) return;

        // Автоматически убираем точку, если юзер её написал (чтобы не было ..btn)
        const name = rawName.startsWith('.') ? rawName.substring(1) : rawName;

        if (!ussDatabase[currentTheme][name]) {
            ussDatabase[currentTheme][name] = {
                // Создаем сразу с парой свойств, чтобы не было пусто
                // Но можно сделать и пустым, если хочешь
                "background-color": "#ffffff"
            };
        }
        inputNewClass.value = '';
        renderUSS();
    });

    function renderUSS() {
        ussListContainer.innerHTML = '';
        const classes = ussDatabase[currentTheme];

        // УЛУЧШЕНИЕ: Пустое состояние
        if (Object.keys(classes).length === 0) {
            ussListContainer.innerHTML = `
                <div style="text-align:center; padding: 40px; color: #666;">
                    <div style="font-size:40px; margin-bottom:10px;">🎨</div>
                    <div>Список стилей пуст</div>
                    <div style="font-size:12px; margin-top:5px;">Придумай имя (например "btn") и нажми +</div>
                </div>
            `;
            return;
        }

        for (const [className, props] of Object.entries(classes)) {
            const card = document.createElement('div');
            card.className = 'uss-class-card';

            let propsHTML = '';
            for (const [propName, propValue] of Object.entries(props)) {
                propsHTML += `
                    <div class="prop-item">
                        <label>${propName}</label>
                        <input type="text" class="prop-val" 
                               data-class="${className}" 
                               data-prop="${propName}" 
                               value="${propValue}">
                        <button class="btn-del-prop" onclick="deleteProp('${className}', '${propName}')">×</button>
                    </div>
                `;
            }

            const optionsHTML = unityProperties.map(p => `<option value="${p}">${p}</option>`).join('');

            card.innerHTML = `
                <div class="class-header" style="justify-content:space-between;">
                    <div style="display:flex; align-items:center;">
                        <span class="dot">.</span>
                        <strong style="font-size:16px; color:#ddd;">${className}</strong>
                    </div>
                    <button class="btn-delete-class" onclick="deleteClass('${className}')">🗑</button>
                </div>
                
                <div class="props-grid">
                    ${propsHTML}
                </div>

                <div class="add-prop-area">
                    <select class="uss-prop-select" id="sel-${className}">
                        ${optionsHTML}
                    </select>
                    <button class="btn-add-prop-action" onclick="addProp('${className}')">+</button>
                </div>
            `;
            ussListContainer.appendChild(card);
        }

        const inputs = ussListContainer.querySelectorAll('.prop-val');
        inputs.forEach(inp => {
            inp.addEventListener('input', (e) => {
                const cName = e.target.getAttribute('data-class');
                const cProp = e.target.getAttribute('data-prop');
                ussDatabase[currentTheme][cName][cProp] = e.target.value;
            });
        });
    }

    // --- PREVIEW ---
    function generatePreview() {
        gameView.innerHTML = '';
        const styleTag = document.createElement('style');

        // Базовые стили Unity Canvas
        let cssString = `#game-view { 
            display: flex; 
            flex-direction: column; 
            padding: 20px; 
            position: relative; 
            background: #2a2a2a; 
            height: 100%;
            overflow: auto;
        } \n`;

        let ussFileContent = "";

        const themeStyles = ussDatabase[currentTheme];
        for (const [cls, props] of Object.entries(themeStyles)) {
            let propStr = "";
            let propStrPretty = "";
            for (const [prop, val] of Object.entries(props)) {
                if(val) {
                    propStr += `${prop}: ${val}; `;
                    propStrPretty += `    ${prop}: ${val};\n`;
                }
            }
            cssString += `.${cls} { ${propStr} } \n`;
            ussFileContent += `.${cls} {\n${propStrPretty}}\n\n`;
        }

        styleTag.innerHTML = cssString;
        gameView.appendChild(styleTag);

        const rootBlocks = Array.from(rootCanvas.children).filter(el => el.classList.contains('scratch-block'));

        // DOM
        rootBlocks.forEach(block => {
            const element = convertBlockToElement(block);
            if(element) gameView.appendChild(element);
        });

        // CODE TEXT
        let uxmlHeader = `<ui:UXML xmlns:ui="UnityEngine.UIElements" xmlns:uie="UnityEditor.UIElements" editor-extension-mode="False">\n`;
        let uxmlBody = "";
        rootBlocks.forEach(block => uxmlBody += generateUXMLRecursive(block, 1));
        let uxmlFooter = `</ui:UXML>`;

        const outUxml = document.getElementById('out-uxml');
        const outUss = document.getElementById('out-uss');

        if(outUxml) outUxml.value = uxmlHeader + uxmlBody + uxmlFooter;
        if(outUss) outUss.value = ussFileContent;
    }

    function convertBlockToElement(scratchBlock) {
        const type = scratchBlock.dataset.type;
        let el;

        // Создаем HTML элемент
        if (type === 'Button') {
            el = document.createElement('button');
            // Стили, чтобы кнопка выглядела нейтрально, как в Unity
            el.style.border = "none";
            el.style.cursor = "pointer";
            el.style.display = "flex";
            el.style.alignItems = "center";
            el.style.justifyContent = "center";
        } else if (type === 'TextField') {
            el = document.createElement('input');
        } else if (type === 'Toggle') {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '5px';
            const chk = document.createElement('input');
            chk.type = 'checkbox';
            const lbl = document.createElement('span');
            wrapper.appendChild(chk);
            wrapper.appendChild(lbl);
            el = wrapper;
        } else {
            el = document.createElement('div'); // VisualElement, Label
        }

        // Добавляем класс (если есть)
        const classInput = scratchBlock.querySelector('.uxml-class');
        if (classInput && classInput.value) el.classList.add(classInput.value);

        // Добавляем текст (если есть)
        const textInput = scratchBlock.querySelector('.uxml-text');
        if (textInput && textInput.value) {
            if (type === 'TextField') el.value = textInput.value;
            else if (type === 'Toggle') el.querySelector('span').innerText = textInput.value;
            else el.innerText = textInput.value;
        }

        // --- ИСПРАВЛЕНИЕ: БОЛЬШЕ НЕТ АВТОМАТИЧЕСКОГО ТЕКСТА "LABEL" ---
        // Раньше тут был код, который писал "Label", если пусто. Я его удалил.

        // Обрабатываем детей (вложенные блоки)
        const childrenContainer = scratchBlock.querySelector('.block-children');
        if (childrenContainer) {
            const childBlocks = Array.from(childrenContainer.children).filter(c => c.classList.contains('scratch-block'));
            childBlocks.forEach(child => {
                const childEl = convertBlockToElement(child);
                if(childEl) el.appendChild(childEl);
            });
        }
        return el;
    }

    function generateUXMLRecursive(block, indentLevel) {
        const type = block.dataset.type;
        const className = block.querySelector('.uxml-class').value;
        const textInput = block.querySelector('.uxml-text');
        const textVal = textInput ? textInput.value : '';
        const tagName = `ui:${type}`;

        let attributes = "";
        if(className) attributes += ` class="${className}"`;
        if(textVal && (type === 'Button' || type === 'Label' || type === 'Toggle')) attributes += ` text="${textVal}"`;
        if(type === 'TextField') attributes += ` value="${textVal}"`;

        const space = "    ".repeat(indentLevel);
        const childrenContainer = block.querySelector('.block-children');
        const childBlocks = childrenContainer
            ? Array.from(childrenContainer.children).filter(c => c.classList.contains('scratch-block'))
            : [];

        if (childBlocks.length === 0) {
            return `${space}<${tagName}${attributes} />\n`;
        } else {
            let innerHTML = "";
            childBlocks.forEach(child => innerHTML += generateUXMLRecursive(child, indentLevel + 1));
            return `${space}<${tagName}${attributes}>\n${innerHTML}${space}</${tagName}>\n`;
        }
    }

    // --- ГЛОБАЛЬНЫЕ ФУНКЦИИ (ДЛЯ HTML) ---
    window.deleteClass = function(className) {
        if(confirm(`Удалить стиль .${className}?`)) {
            delete ussDatabase[currentTheme][className];
            renderUSS();
        }
    };
    window.deleteProp = function(className, propName) {
        delete ussDatabase[currentTheme][className][propName];
        renderUSS();
    };
    window.addProp = function(className) {
        const select = document.getElementById(`sel-${className}`);
        const newProp = select.value;
        if(!ussDatabase[currentTheme][className][newProp]) {
            ussDatabase[currentTheme][className][newProp] = "0px";
            if(newProp.includes('color')) ussDatabase[currentTheme][className][newProp] = "#ffffff";
            if(newProp === 'flex-direction') ussDatabase[currentTheme][className][newProp] = "column";
            if(newProp === 'align-items') ussDatabase[currentTheme][className][newProp] = "stretch";
        }
        renderUSS();
    };
    window.copyToClipboard = function(elementId) {
        const copyText = document.getElementById(elementId);
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand("copy");
    };

    // ИСПРАВЛЕННАЯ ОЧИСТКА
    window.clearWorkspace = function() {
        if(confirm("Очистить всё дерево элементов?")) {
            rootCanvas.innerHTML = '';
            selectedBlock = null; // <--- ВОТ ЭТОЙ СТРОЧКИ НЕ ХВАТАЛО! Мы сбрасываем выделение.

            // Создаем корневой элемент заново
            createBlock('VisualElement');
        }
    }

    // Старт (создаем 1 блок)
    createBlock('VisualElement');
});