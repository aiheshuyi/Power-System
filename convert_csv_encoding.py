#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSV编码转换工具
用于将GBK/GB2312编码的CSV文件转换为UTF-8编码
"""

import pandas as pd
import sys
import os

def convert_csv_encoding(input_file, output_file=None, input_encoding='GBK'):
    """
    转换CSV文件编码
    
    Args:
        input_file (str): 输入文件路径
        output_file (str): 输出文件路径，如果为None则自动生成
        input_encoding (str): 输入文件编码，默认为GBK
    """
    try:
        print(f"正在读取文件: {input_file}")
        print(f"使用编码: {input_encoding}")
        
        # 读取CSV文件
        df = pd.read_csv(input_file, encoding=input_encoding)
        
        print(f"成功读取文件，共 {len(df)} 行数据")
        print(f"列名: {list(df.columns)}")
        
        # 生成输出文件名
        if output_file is None:
            base_name = os.path.splitext(input_file)[0]
            output_file = f"{base_name}_utf8.csv"
        
        # 保存为UTF-8编码
        df.to_csv(output_file, encoding='utf-8', index=False)
        
        print(f"成功转换编码，输出文件: {output_file}")
        print(f"文件大小: {os.path.getsize(output_file)} 字节")
        
        # 显示前几行数据
        print("\n前5行数据预览:")
        print(df.head())
        
        return True
        
    except UnicodeDecodeError as e:
        print(f"编码错误: {e}")
        print("尝试其他编码...")
        
        # 尝试其他编码
        encodings = ['GB2312', 'Big5', 'UTF-8', 'ISO-8859-1']
        for enc in encodings:
            if enc == input_encoding:
                continue
                
            try:
                print(f"尝试使用 {enc} 编码...")
                df = pd.read_csv(input_file, encoding=enc)
                print(f"成功使用 {enc} 编码读取文件")
                
                # 保存为UTF-8编码
                if output_file is None:
                    base_name = os.path.splitext(input_file)[0]
                    output_file = f"{base_name}_utf8.csv"
                
                df.to_csv(output_file, encoding='utf-8', index=False)
                print(f"成功转换编码，输出文件: {output_file}")
                return True
                
            except UnicodeDecodeError:
                print(f"{enc} 编码失败")
                continue
        
        print("所有编码都尝试失败")
        return False
        
    except Exception as e:
        print(f"处理文件时出错: {e}")
        return False

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("使用方法: python convert_csv_encoding.py <输入文件> [输出文件] [输入编码]")
        print("示例: python convert_csv_encoding.py 22-25_All.csv")
        print("示例: python convert_csv_encoding.py 22-25_All.csv 22-25_All_utf8.csv GBK")
        return
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    input_encoding = sys.argv[3] if len(sys.argv) > 3 else 'GBK'
    
    if not os.path.exists(input_file):
        print(f"错误: 文件 {input_file} 不存在")
        return
    
    print("=== CSV编码转换工具 ===")
    print(f"输入文件: {input_file}")
    print(f"输出文件: {output_file}")
    print(f"输入编码: {input_encoding}")
    print("=" * 30)
    
    success = convert_csv_encoding(input_file, output_file, input_encoding)
    
    if success:
        print("\n✅ 转换成功！")
        print("请将转换后的文件放到 public 目录下替换原文件")
    else:
        print("\n❌ 转换失败！")
        print("请检查文件编码或手动转换")

if __name__ == "__main__":
    main() 