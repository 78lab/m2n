import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // 코드 하이라이트 테마 (원하면 변경 가능)
import './App.css';

function App() {
  // 초기값 설정
  const [markdown, setMarkdown] = useState(`# 제목을 입력하세요

여기에 내용을 입력하면 **오른쪽**에서 변환됩니다.

> 인용구 스타일도 네이버 블로그에 맞춰집니다.

\`\`\`js
console.log("코드 블록도 예쁘게 변환됩니다.");
\`\`\`
`);
  
  const [htmlContent, setHtmlContent] = useState('');
  const previewRef = useRef(null);

  useEffect(() => {
    // 1. 커스텀 렌더러: HTML 태그 생성 시 스타일 강제 주입
    const renderer = new marked.Renderer();

    // H1, H2, H3 스타일
    renderer.heading = function ({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const style = 'font-size: 1.5em; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 10px; margin: 30px 0 20px; color: #000;';
      return `<h${depth} style="${style}">${text}</h${depth}>`;
    };

    // 본문(P) 스타일
    renderer.paragraph = function ({ tokens }) {
      const text = this.parser.parseInline(tokens);
      // line-height: 1.8 (가독성), margin-bottom: 16px (문단 간격)
      const style = 'font-size: 16px; line-height: 1.8; color: #333; margin-bottom: 16px;';
      return `<p style="${style}">${text}</p>`;
    };

    // 인용구(Blockquote) 스타일 (네이버 스타일 녹색 바)
    renderer.blockquote = function ({ tokens }) {
      const body = this.parser.parse(tokens);
      const style = 'border-left: 4px solid #03c75a; background: #f9f9f9; padding: 15px 20px; margin: 20px 0; color: #555;';
      return `<blockquote style="${style}">${body}</blockquote>`;
    };

    // 코드 블록(Code) 스타일 (pre 태그에 스타일 주입)
    renderer.code = function ({ text, lang }) {
       const language = hljs.getLanguage(lang) ? lang : 'plaintext';
       const highlighted = hljs.highlight(text, { language }).value;
       // pre 태그 스타일
       const style = 'background-color: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; margin: 20px 0; font-family: Consolas, monospace;';
       return `<pre style="${style}"><code class="hljs language-${language}">${highlighted}</code></pre>`;
    };

    // 2. marked 옵션 설정
    marked.setOptions({
      renderer: renderer,
      breaks: true, // 엔터키를 <br>로 인식
    });

    // 3. 변환 실행 (Frontmatter 제거 후 변환)
    const cleanMarkdown = markdown.replace(/^---[\s\S]*?---\n/, ''); // 맨 위 --- 정보 제거
    const rawHtml = marked.parse(cleanMarkdown);
    setHtmlContent(DOMPurify.sanitize(rawHtml)); // 보안 처리

  }, [markdown]);

  // ★ 복사 기능: 텍스트가 아닌 'HTML 데이터'로 클립보드에 쓰기
  const handleCopy = async () => {
    if (!previewRef.current) return;
    try {
      const type = "text/html";
      const blob = new Blob([previewRef.current.innerHTML], { type });
      const data = [new ClipboardItem({ [type]: blob })];
      await navigator.clipboard.write(data);
      alert('✅ 복사 완료! 네이버 블로그에 붙여넣기(Ctrl+V) 하세요.');
    } catch (err) {
      console.error(err);
      alert('복사 실패: 브라우저 권한을 확인하세요.');
    }
  };

  return (
    <div className="container">
      <header className="header">
        <div className="logo">M2N Clone</div>
        <button onClick={handleCopy} className="copy-btn">네이버 블로그용 복사</button>
      </header>
      <div className="editor-wrap">
        <textarea
          className="editor-input"
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder="마크다운을 입력하세요..."
        />
        <div 
          className="editor-preview"
          ref={previewRef}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
}

export default App;