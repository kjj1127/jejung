    const editor = document.getElementById('editor');
    const previewFrame = document.getElementById('previewFrame');
    const resizer = document.getElementById('resizer');
    const editorPane = document.getElementById('editorPane');
    const previewPane = document.getElementById('previewPane');
    const overlay = document.getElementById('overlay');
    const messageBox = document.getElementById('messageBox');

    // 기본 HTML 템플릿
    const defaultHtmlTemplate = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8" />
    <title></title>
    <style>

    </style>
</head>
<body>

</body>
<script>

</script>
</html>`;

    // 초기 저장된 코드 불러오기 또는 기본 템플릿 사용
    const savedCode = localStorage.getItem('savedCode');
    if(savedCode !== null) {
        editor.value = savedCode;
    } else {
        editor.value = defaultHtmlTemplate;
    }

    // 미리보기 업데이트 함수 - iframe에 전체 문서로 작성
function updatePreview() {
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  doc.open();
  doc.write(editor.value); // 전체 HTML을 직접 삽입
  doc.close();
}



    // 자동 저장 및 미리보기 갱신
    editor.addEventListener('input', () => {
        localStorage.setItem('savedCode', editor.value);
        updatePreview();
    });

    updatePreview();

    // 코드 복사
    function copyCode() {
        navigator.clipboard.writeText(editor.value).then(() => {
            messageBox.classList.add('show');
            setTimeout(() => {
                messageBox.classList.remove('show');
            }, 2000);
        }).catch(() => {
            alert('복사 실패');
        });
    }

    // Reset 기능
    function resetEditor() {
        if (confirm('모든 저장된 코드를 지우고 초기 상태로 되돌리시겠습니까?')) {
            localStorage.removeItem('savedCode'); // localStorage에서 코드 삭제
            editor.value = defaultHtmlTemplate; // textarea를 기본 템플릿으로 설정
            updatePreview(); // 미리보기 업데이트
            alert('에디터가 초기화되었습니다.'); // 사용자에게 알림
        }
    }

    // 레이아웃 조정 버튼
    function setSplit(mode) {
        const totalWidth = editorPane.parentNode.clientWidth;
        const resizerWidth = resizer.offsetWidth;
        if(mode === 'left') {
            editorPane.style.width = (totalWidth - resizerWidth) + 'px';
            previewPane.style.width = '0px';
        } else if(mode === 'right') {
            editorPane.style.width = '0px';
            previewPane.style.width = (totalWidth - resizerWidth) + 'px';
        } else {
            editorPane.style.width = ((totalWidth - resizerWidth) / 2) + 'px';
            previewPane.style.width = ((totalWidth - resizerWidth) / 2) + 'px';
        }
    }

    // 리사이저 드래그 이벤트
    let isResizing = false;
    let animationFrameRequested = false;
    let currentMouseX = 0;

    resizer.addEventListener('mousedown', e => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        overlay.style.display = 'block';
        e.preventDefault();
    });

    overlay.addEventListener('mousemove', e => {
        if(!isResizing) return;

        currentMouseX = e.clientX;

        if (!animationFrameRequested) {
            requestAnimationFrame(updateResizer);
            animationFrameRequested = true;
        }
    });

    document.addEventListener('mouseup', () => {
        isResizing = false;
        animationFrameRequested = false;
        document.body.style.cursor = '';
        overlay.style.display = 'none';
    });

    function updateResizer() {
        if (!isResizing) {
            animationFrameRequested = false;
            return;
        }

        const containerWidth = editorPane.parentNode.clientWidth;
        const resizerWidth = resizer.offsetWidth;
        let newEditorWidth = currentMouseX;

        const minPaneWidth = 50;
        if(newEditorWidth < minPaneWidth) newEditorWidth = minPaneWidth;
        if(newEditorWidth > containerWidth - resizerWidth - minPaneWidth) newEditorWidth = containerWidth - resizerWidth - minPaneWidth;

        editorPane.style.width = newEditorWidth + 'px';
        previewPane.style.width = (containerWidth - newEditorWidth - resizerWidth) + 'px';

        requestAnimationFrame(updateResizer);
    }

    // 탭 및 Shift+탭 들여쓰기/내어쓰기 처리
    editor.addEventListener('keydown', function(e) {
        if(e.key === 'Tab') {
            e.preventDefault();

            const start = this.selectionStart;
            const end = this.selectionEnd;
            const value = this.value;

            const beforeSelection = value.lastIndexOf('\n', start - 1) + 1;
            let selectionEnd = value.indexOf('\n', end);
            if (selectionEnd === -1) {
                selectionEnd = value.length;
            }

            const selectedText = value.substring(beforeSelection, selectionEnd);
            const lines = selectedText.split('\n');
            const isShift = e.shiftKey;

            let modifiedText = '';
            let newCursorPosition = start;

            if(isShift) {
                modifiedText = lines.map(line => {
                    if (line.startsWith('    ')) {
                        return line.slice(4);
                    } else if (line.startsWith(' ')) {
                        return line.replace(/^ +/, '');
                    }
                    return line;
                }).join('\n');
            } else {
                modifiedText = lines.map(line => '    ' + line).join('\n');
            }

            this.value = value.substring(0, beforeSelection) + modifiedText + value.substring(selectionEnd);

            if (start === end) {
                if (isShift) {
                    newCursorPosition = Math.max(beforeSelection, start - (selectedText.length - modifiedText.length));
                } else {
                    newCursorPosition = start + 4;
                }
            } else {
                if (isShift) {
                    newCursorPosition = beforeSelection + (selectedText.length - modifiedText.length);
                } else {
                    newCursorPosition = beforeSelection;
                }
                this.selectionEnd = beforeSelection + modifiedText.length;
            }
            this.selectionStart = this.selectionEnd = newCursorPosition;

            localStorage.setItem('savedCode', editor.value);
            updatePreview();
        }
    });

    // 드래그앤드롭 이벤트
    editorPane.addEventListener('dragover', e => {
        e.preventDefault();
        editorPane.classList.add('dragover');
    });
    editorPane.addEventListener('dragleave', e => {
        e.preventDefault();
        editorPane.classList.remove('dragover');
    });
    editorPane.addEventListener('drop', e => {
        e.preventDefault();
        editorPane.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if(files.length === 0) return;

        const file = files[0];
        if(file.type !== 'text/html' && !file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
            alert('HTML 파일만 드래그앤드롭 해주세요.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(evt) {
            editor.value = evt.target.result;
            localStorage.setItem('savedCode', editor.value);
            updatePreview();
        };
        reader.readAsText(file);
    });