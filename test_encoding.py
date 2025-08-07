#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试编码转换功能
"""

import os
import sys
from convert_csv_encoding import try_multiple_encodings

def test_encoding_conversion():
    """测试编码转换功能"""
    print("开始测试编码转换功能...")
    
    # 检查CSV文件是否存在
    csv_file = "public/22-25_All.csv"
    if not os.path.exists(csv_file):
        print(f"❌ 文件不存在: {csv_file}")
        print("请确保CSV文件在正确位置")
        return False
    
    print(f"✅ 找到文件: {csv_file}")
    print(f"文件大小: {os.path.getsize(csv_file)} 字节")
    
    # 尝试转换编码
    output_file = "public/22-25_All_utf8.csv"
    success = try_multiple_encodings(csv_file, output_file)
    
    if success:
        print(f"✅ 编码转换成功！")
        print(f"输出文件: {output_file}")
        print(f"输出文件大小: {os.path.getsize(output_file)} 字节")
        
        # 验证转换结果
        try:
            import pandas as pd
            df = pd.read_csv(output_file, encoding='UTF-8')
            print(f"✅ 验证成功，转换后文件包含 {len(df)} 行数据")
            print(f"列名: {list(df.columns)}")
            
            # 检查是否有乱码
            sample_text = str(df.iloc[0:3].to_string())
            if '锟斤拷' in sample_text or '嚙踝蕭' in sample_text:
                print("⚠️  警告: 检测到乱码字符")
                return False
            else:
                print("✅ 未检测到乱码字符")
                return True
                
        except Exception as e:
            print(f"❌ 验证失败: {e}")
            return False
    else:
        print("❌ 编码转换失败")
        return False

def main():
    """主函数"""
    print("=" * 50)
    print("CSV编码转换测试")
    print("=" * 50)
    
    success = test_encoding_conversion()
    
    if success:
        print("\n🎉 测试通过！")
        print("建议:")
        print("1. 将转换后的文件重命名为 22-25_All.csv")
        print("2. 替换 public 目录中的原文件")
        print("3. 重启React应用")
    else:
        print("\n❌ 测试失败！")
        print("请检查:")
        print("1. CSV文件是否存在")
        print("2. 文件是否损坏")
        print("3. 是否有足够的磁盘空间")

if __name__ == "__main__":
    main() 