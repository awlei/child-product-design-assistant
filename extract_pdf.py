#!/usr/bin/env python3
import fitz  # PyMuPDF
import sys

def extract_pdf_text(pdf_path, output_path=None):
    """提取PDF文件的文本内容"""
    try:
        doc = fitz.open(pdf_path)
        text_content = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            text_content.append(f"=== Page {page_num + 1} ===\n")
            text_content.append(text)
            text_content.append("\n\n")
        
        doc.close()
        full_text = "".join(text_content)
        
        if output_path:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(full_text)
            print(f"文本已保存到: {output_path}")
        
        return full_text
    except Exception as e:
        print(f"提取PDF失败: {e}")
        return None

if __name__ == "__main__":
    # 提取第一个PDF
    print("正在提取FMVSS 213a Side Impact...")
    extract_pdf_text(
        "/workspace/projects/assets/Final-rule-FMVSS-213a-side-impact-child-restraint-systems-web (1).pdf",
        "/workspace/projects/fmvss_213a_side_impact.txt"
    )
    
    # 提取第二个PDF
    print("\n正在提取FMVSS 213...")
    extract_pdf_text(
        "/workspace/projects/assets/TP-213-11-10272023 213.pdf",
        "/workspace/projects/fmvss_213.txt"
    )
    
    print("\n提取完成！")
