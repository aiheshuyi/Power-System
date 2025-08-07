#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSV文件诊断工具
检查文件状态、编码和内容
"""

import os
import sys
import pandas as pd
from pathlib import Path

def diagnose_csv_file(file_path):
    """诊断CSV文件"""
    print(f"🔍 开始诊断文件: {file_path}")
    print("=" * 50)
    
    # 检查文件是否存在
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return False
    
    # 获取文件信息
    file_size = os.path.getsize(file_path)
    print(f"✅ 文件存在，大小: {file_size:,} 字节 ({file_size/1024/1024:.2f} MB)")
    
    # 检查文件权限
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            f.read(100)
        print("✅ 文件可读")
    except Exception as e:
        print(f"❌ 文件读取失败: {e}")
        return False
    
    # 尝试不同的编码读取
    encodings = ['utf-8', 'gbk', 'gb2312', 'big5', 'gb18030']
    successful_encodings = []
    
    print("\n📖 尝试不同编码读取文件...")
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                content = f.read(1000)  # 读取前1000字符
            
            # 检查是否包含乱码
            has_garbled = '锟斤拷' in content or '嚙踝蕭' in content
            has_chinese = any('\u4e00' <= char <= '\u9fff' for char in content)
            has_expected_columns = all(col in content for col in ['年', '月', '日', '时'])
            
            if not has_garbled and has_chinese and has_expected_columns:
                successful_encodings.append(encoding)
                print(f"✅ {encoding}: 成功 (无乱码，包含中文，包含预期列名)")
            elif not has_garbled and has_chinese:
                print(f"⚠️  {encoding}: 部分成功 (无乱码，包含中文，但缺少预期列名)")
            elif not has_garbled:
                print(f"⚠️  {encoding}: 部分成功 (无乱码，但不包含中文)")
            else:
                print(f"❌ {encoding}: 失败 (包含乱码)")
                
        except UnicodeDecodeError:
            print(f"❌ {encoding}: 解码失败")
        except Exception as e:
            print(f"❌ {encoding}: 读取失败 - {e}")
    
    # 使用pandas读取
    print("\n📊 使用pandas读取文件...")
    for encoding in successful_encodings:
        try:
            df = pd.read_csv(file_path, encoding=encoding, nrows=5)
            print(f"✅ pandas + {encoding}: 成功读取 {len(df)} 行数据")
            print(f"   列名: {list(df.columns)}")
            print(f"   前3行数据:")
            print(df.head(3).to_string())
            break
        except Exception as e:
            print(f"❌ pandas + {encoding}: 失败 - {e}")
    
    # 检查文件内容样本
    print("\n📝 文件内容样本...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = [f.readline().strip() for _ in range(5)]
        
        for i, line in enumerate(lines, 1):
            print(f"第{i}行: {line[:100]}{'...' if len(line) > 100 else ''}")
            
    except Exception as e:
        print(f"❌ 读取文件内容失败: {e}")
    
    # 检查文件格式
    print("\n🔍 检查文件格式...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            first_line = f.readline().strip()
        
        if ',' in first_line:
            print("✅ 文件格式: CSV (逗号分隔)")
        elif '\t' in first_line:
            print("✅ 文件格式: TSV (制表符分隔)")
        else:
            print("⚠️  文件格式: 未知分隔符")
            
        print(f"第一行字段数: {len(first_line.split(','))}")
        
    except Exception as e:
        print(f"❌ 检查文件格式失败: {e}")
    
    return len(successful_encodings) > 0

def main():
    """主函数"""
    print("CSV文件诊断工具")
    print("=" * 50)
    
    # 检查Python依赖
    try:
        import pandas as pd
        print("✅ pandas库已安装")
    except ImportError:
        print("❌ 缺少pandas库")
        print("请运行: pip install pandas")
        return
    
    # 诊断文件
    csv_file = "public/22-25_All.csv"
    success = diagnose_csv_file(csv_file)
    
    if success:
        print("\n🎉 诊断完成！文件看起来正常")
        print("建议:")
        print("1. 重启React应用")
        print("2. 检查浏览器控制台")
        print("3. 访问 http://localhost:3000/test_browser_encoding.html 进行浏览器测试")
    else:
        print("\n❌ 诊断发现问题！")
        print("建议:")
        print("1. 检查文件是否损坏")
        print("2. 重新转换文件编码")
        print("3. 确认文件路径正确")

if __name__ == "__main__":
    main() 