#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSV文件编码转换工具
用于解决"锟斤拷"乱码问题
"""

import pandas as pd
import os
import sys
from pathlib import Path

def convert_csv_encoding(input_file, output_file=None, input_encoding='GBK', output_encoding='UTF-8'):
    """
    转换CSV文件编码
    
    Args:
        input_file: 输入文件路径
        output_file: 输出文件路径，如果为None则自动生成
        input_encoding: 输入文件编码
        output_encoding: 输出文件编码
    """
    try:
        print(f"正在读取文件: {input_file}")
        print(f"输入编码: {input_encoding}")
        
        # 读取CSV文件
        df = pd.read_csv(input_file, encoding=input_encoding)
        
        print(f"成功读取文件，共 {len(df)} 行数据")
        print(f"列名: {list(df.columns)}")
        
        # 检查是否有乱码
        sample_text = str(df.iloc[0:3].to_string())
        if '锟斤拷' in sample_text or '嚙踝蕭' in sample_text:
            print("警告: 检测到乱码字符，可能需要尝试其他输入编码")
            print("建议尝试: GB2312, GB18030, Big5")
        
        # 生成输出文件名
        if output_file is None:
            input_path = Path(input_file)
            output_file = input_path.parent / f"{input_path.stem}_utf8{input_path.suffix}"
        
        # 保存为UTF-8编码
        df.to_csv(output_file, encoding=output_encoding, index=False)
        
        print(f"成功转换编码并保存到: {output_file}")
        print(f"输出编码: {output_encoding}")
        
        # 验证转换结果
        print("\n验证转换结果...")
        df_verify = pd.read_csv(output_file, encoding=output_encoding)
        print(f"验证成功，转换后文件包含 {len(df_verify)} 行数据")
        
        return True
        
    except UnicodeDecodeError as e:
        print(f"编码错误: {e}")
        print("请尝试其他输入编码，如: GB2312, GB18030, Big5")
        return False
    except FileNotFoundError:
        print(f"文件未找到: {input_file}")
        return False
    except Exception as e:
        print(f"转换失败: {e}")
        return False

def try_multiple_encodings(input_file, output_file=None):
    """
    尝试多种编码方式转换文件
    
    Args:
        input_file: 输入文件路径
        output_file: 输出文件路径
    """
    encodings = ['GBK', 'GB2312', 'GB18030', 'Big5', 'UTF-8']
    
    print(f"开始尝试多种编码方式转换文件: {input_file}")
    print("=" * 50)
    
    for encoding in encodings:
        print(f"\n尝试使用 {encoding} 编码...")
        if convert_csv_encoding(input_file, output_file, encoding, 'UTF-8'):
            print(f"✅ 成功使用 {encoding} 编码转换文件")
            return True
        else:
            print(f"❌ {encoding} 编码转换失败")
    
    print("\n❌ 所有编码方式都尝试失败")
    return False

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("使用方法:")
        print("python convert_csv_encoding.py <输入文件> [输出文件]")
        print("\n示例:")
        print("python convert_csv_encoding.py 22-25_All.csv")
        print("python convert_csv_encoding.py 22-25_All.csv 22-25_All_utf8.csv")
        return
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not os.path.exists(input_file):
        print(f"错误: 文件不存在 - {input_file}")
        return
    
    print("CSV文件编码转换工具")
    print("=" * 50)
    
    # 尝试多种编码方式
    success = try_multiple_encodings(input_file, output_file)
    
    if success:
        print("\n✅ 文件编码转换完成！")
        print("请将转换后的文件放到 public 目录中，并确保文件名为 22-25_All.csv")
    else:
        print("\n❌ 文件编码转换失败")
        print("建议:")
        print("1. 检查文件是否损坏")
        print("2. 尝试使用其他工具转换编码")
        print("3. 联系文件提供方获取正确编码的文件")

if __name__ == "__main__":
    main() 