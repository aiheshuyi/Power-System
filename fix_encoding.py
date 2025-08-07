#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
快速修复CSV编码问题
自动完成编码转换和文件替换
"""

import os
import shutil
import sys
from pathlib import Path
from convert_csv_encoding import try_multiple_encodings

def fix_csv_encoding():
    """快速修复CSV编码问题"""
    print("🔧 开始快速修复CSV编码问题...")
    print("=" * 50)
    
    # 检查原始文件
    original_file = "public/22-25_All.csv"
    backup_file = "public/22-25_All_backup.csv"
    temp_file = "public/22-25_All_utf8.csv"
    
    if not os.path.exists(original_file):
        print(f"❌ 原始文件不存在: {original_file}")
        print("请确保CSV文件在正确位置")
        return False
    
    print(f"✅ 找到原始文件: {original_file}")
    print(f"文件大小: {os.path.getsize(original_file)} 字节")
    
    # 创建备份
    print("\n📋 创建备份文件...")
    try:
        shutil.copy2(original_file, backup_file)
        print(f"✅ 备份文件已创建: {backup_file}")
    except Exception as e:
        print(f"❌ 创建备份失败: {e}")
        return False
    
    # 转换编码
    print("\n🔄 开始转换编码...")
    success = try_multiple_encodings(original_file, temp_file)
    
    if not success:
        print("❌ 编码转换失败")
        return False
    
    print(f"✅ 编码转换成功: {temp_file}")
    
    # 验证转换结果
    print("\n🔍 验证转换结果...")
    try:
        import pandas as pd
        df = pd.read_csv(temp_file, encoding='UTF-8')
        print(f"✅ 验证成功，转换后文件包含 {len(df)} 行数据")
        
        # 检查是否有乱码
        sample_text = str(df.iloc[0:3].to_string())
        if '锟斤拷' in sample_text or '嚙踝蕭' in sample_text:
            print("⚠️  警告: 检测到乱码字符")
            print("建议手动检查文件内容")
        else:
            print("✅ 未检测到乱码字符")
        
    except Exception as e:
        print(f"❌ 验证失败: {e}")
        return False
    
    # 替换原文件
    print("\n🔄 替换原文件...")
    try:
        # 删除原文件
        os.remove(original_file)
        # 重命名转换后的文件
        os.rename(temp_file, original_file)
        print(f"✅ 文件替换成功: {original_file}")
    except Exception as e:
        print(f"❌ 文件替换失败: {e}")
        # 恢复备份
        shutil.copy2(backup_file, original_file)
        print("✅ 已恢复备份文件")
        return False
    
    # 验证最终结果
    print("\n🔍 验证最终结果...")
    try:
        df = pd.read_csv(original_file, encoding='UTF-8')
        print(f"✅ 最终验证成功，文件包含 {len(df)} 行数据")
        print(f"列名: {list(df.columns)}")
    except Exception as e:
        print(f"❌ 最终验证失败: {e}")
        return False
    
    print("\n🎉 编码修复完成！")
    print("=" * 50)
    print("✅ 原始文件已备份为: 22-25_All_backup.csv")
    print("✅ 原文件已转换为UTF-8编码")
    print("✅ 可以重新启动React应用测试")
    
    return True

def main():
    """主函数"""
    print("CSV编码快速修复工具")
    print("=" * 50)
    
    # 检查Python依赖
    try:
        import pandas as pd
        print("✅ pandas库已安装")
    except ImportError:
        print("❌ 缺少pandas库")
        print("请运行: pip install pandas")
        return
    
    # 执行修复
    success = fix_csv_encoding()
    
    if success:
        print("\n🎉 修复成功！")
        print("下一步:")
        print("1. 重启React应用: npm start")
        print("2. 检查数据是否正常加载")
        print("3. 如果仍有问题，可以恢复备份文件")
    else:
        print("\n❌ 修复失败！")
        print("请检查:")
        print("1. 文件权限")
        print("2. 磁盘空间")
        print("3. 文件是否损坏")

if __name__ == "__main__":
    main() 