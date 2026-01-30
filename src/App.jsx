import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import './App.css';

function App() {
  const [markdown, setMarkdown] = useState(`# 제목 1 (H1)
## 제목 2 (H2)
### 제목 3 (H3)
#### 제목 4 (H4)

제목 4는 본문보다 약간 더 크고 굵게 표시됩니다.
아래에 간격도 동일하게 들어갑니다.

본문 내용입니다. (19px)
`);
  const [htmlContent, setHtmlContent] = useState('');
  const previewRef = useRef(null);

  useEffect(() => {
    marked.use({
      gfm: true,
      breaks: true,
    });
  }, []);

  const applyNaverStyles = (rawHtml) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rawHtml;

    // [전체 폰트]
    tempDiv.style.cssText = "font-family: 'Nanum Gothic', sans-serif; font-weight: normal; color: #333; font-size: 19px; line-height: 1.8;";

    const styles = {
      h1: "display: block; font-size: 30px; font-weight: bold;  color: #000; letter-spacing: -1px; margin: 0;",
      h2: "display: block; font-size: 26px; font-weight: bold; color: #000; letter-spacing: -1px; margin: 0;",
      h3: "display: block; font-size: 22px; font-weight: bold; color: #000; margin: 0;",
      
      // ★ [추가됨] H4 스타일 (20px, Bold)
      h4: "display: block; font-size: 20px; font-weight: bold; color: #000; margin: 0;",
      
      div: "display: block; font-size: 19px; font-weight: normal; line-height: 1.8; color: #333; margin: 0; word-break: break-all;",
      
      blockquote: "display: block; border-left: 5px solid #00C73C; background-color: #f7f7f7; padding: 25px; margin: 0; color: #555; font-size: 19px; line-height: 1.8; font-weight: normal;",
      ul: "display: block; padding-left: 20px; margin: 0; color: #333; font-size: 19px; line-height: 1.8; font-weight: normal;",
      ol: "display: block; padding-left: 20px; margin: 0; color: #333; font-size: 19px; line-height: 1.8; font-weight: normal;",
      li: "margin-bottom: 5px; font-weight: normal;",
      
      table: "border-collapse: collapse; width: 100%; margin: 0; border: 1px solid #ddd; font-size: 17px; font-weight: normal;",
      th: "background-color: #f9f9f9; border: 1px solid #ddd; padding: 14px; font-weight: bold; text-align: center; color: #333;",
      td: "border: 1px solid #ddd; padding: 14px; color: #333; line-height: 1.6; font-weight: normal;",
      pre: "background-color: #f6f8fa; padding: 20px; border-radius: 8px; overflow-x: auto; margin: 0; border: 1px solid #e1e4e8;",
      code: "font-family: Consolas, 'Courier New', monospace; font-size: 15px; line-height: 1.6; font-weight: normal;"
    };

    // 1. P 태그 -> DIV 변환
    const pTags = tempDiv.querySelectorAll('p');
    pTags.forEach(p => {
      const div = document.createElement('div');
      div.innerHTML = p.innerHTML;
      div.style.cssText = styles.div;
      p.parentNode.replaceChild(div, p);
    });

    // 2. 스타일 주입
    Object.keys(styles).forEach(tag => {
      if (tag === 'p') return;
      tempDiv.querySelectorAll(tag).forEach(el => {
        el.style.cssText += styles[tag];
      });
    });

    // 중복 방지 스페이서 주입 함수
    const insertSpacer = (element, height = '24px') => {
        const next = element.nextSibling;
        if (next && next.tagName === 'DIV' && next.getAttribute('data-spacer') === 'true') {
            return; 
        }

        const spacer = document.createElement('div');
        spacer.innerHTML = '&nbsp;';
        spacer.setAttribute('data-spacer', 'true');
        spacer.style.cssText = `display: block; height: ${height}; line-height: ${height}; font-size: ${height}; clear: both;`;
        
        if (next) {
            element.parentNode.insertBefore(spacer, next);
        } else {
            element.parentNode.appendChild(spacer);
        }
    };

    // 3. 최상위 요소들에만 순차적으로 스페이서 적용
    const children = Array.from(tempDiv.children);
    
    children.forEach(child => {
        const tag = child.tagName.toLowerCase();
        
        // ★ [수정됨] 제목 태그에 h4 추가
        if (['h1', 'h2', 'h3', 'h4'].includes(tag)) {
            insertSpacer(child, '30px'); // 제목 뒤는 넉넉하게 30px
        } 
        else if (['div', 'ul', 'ol', 'blockquote', 'pre', 'table'].includes(tag)) {
            if (child.getAttribute('data-spacer') === 'true') return;
            insertSpacer(child, '24px');
        }
    });

    // 4. Span 래핑 (19px 고정)
    tempDiv.querySelectorAll('div, li').forEach(el => {
      if (el.getAttribute('data-spacer') === 'true') return;
      if (el.innerHTML === '&nbsp;') return;
      if (el.closest('pre') || el.closest('blockquote')) return;

      if (!el.innerHTML.startsWith('<span style=')) {
          el.innerHTML = `<span style="font-weight: normal; font-size: 19px; line-height: 1.8;">${el.innerHTML}</span>`;
      }
    });

    // 5. 기타 후처리
    tempDiv.querySelectorAll('strong, b').forEach(el => {
        el.style.fontWeight = 'bold';
        el.style.color = '#000';
    });

    tempDiv.querySelectorAll('th, td').forEach(el => {
      const align = el.getAttribute('align');
      if (align) {
        el.style.textAlign = align;
        el.removeAttribute('align');
      }
    });

    tempDiv.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
      block.style.fontFamily = "Consolas, 'Courier New', monospace";
      block.parentElement.style.backgroundColor = "#f6f8fa";
    });

    return tempDiv.innerHTML;
  };

  useEffect(() => {
    const processMarkdown = async () => {
      try {
        let cleanMarkdown = markdown.replace(/^---[\s\S]*?---\n/, '');

        // 1. [Bold 처리] 붙여쓰기 ** 지원
        cleanMarkdown = cleanMarkdown.replace(/\*\*([^\n]+?)\*\*/g, '<strong>$1</strong>');

        // ★★★ 2. [취소선 처리 핵심 로직] ★★★
        // (1) "앞/뒤에 공백이 있거나 줄의 시작/끝"인 ~~만 <del> 태그로 변환
        // 정규식 설명: (^|\s) -> 시작 혹은 공백, ~~ -> 물결, (.+?) -> 내용, ~~ -> 물결, (\s|$) -> 공백 혹은 끝
        // cleanMarkdown = cleanMarkdown.replace(/(^|\s)~~(.+?)~~(\s|$)/gm, '$1<del>$2</del>$3');

        // (2) 위에서 변환되지 않은 나머지 모든 ~~는 이스케이프(\~~) 처리하여 문자로 출력되게 함
        cleanMarkdown = cleanMarkdown.replace(/~/g, '\\~');

        const rawHtml = await marked.parse(cleanMarkdown, { breaks: true, gfm: true });
        const sanitizedHtml = DOMPurify.sanitize(rawHtml);
        const finalHtml = applyNaverStyles(sanitizedHtml);
        setHtmlContent(finalHtml);
      } catch (error) {
        console.error(error);
      }
    };
    processMarkdown();
  }, [markdown]);

  const handleCopy = async () => {
    if (!previewRef.current) return;
    try {
      const type = "text/html";
      const blob = new Blob([previewRef.current.innerHTML], { type });
      const data = [new ClipboardItem({ [type]: blob })];
      await navigator.clipboard.write(data);
      alert('✅ H4 포함 복사 완료!');
    } catch (err) {
      alert('복사 실패');
    }
  };

  return (
    <div className="container">
      <header className="header">
        <div className="logo">M2N + H4 Support</div>
        <button onClick={handleCopy} className="copy-btn">복사하기</button>
      </header>
      <div className="editor-wrap">
        <textarea
          className="editor-input"
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder="내용을 입력하세요..."
        />
        <div 
          className="editor-preview"
          ref={previewRef}
          style={{ fontFamily: "'Nanum Gothic', sans-serif", fontSize: '19px', lineHeight: '1.8' }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
}

export default App;