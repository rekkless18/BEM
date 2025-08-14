/**
 * 测试文件上传功能脚本
 * 模拟文件上传到files存储桶
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少Supabase配置')
  process.exit(1)
}

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testFileUpload() {
  try {
    console.log('正在测试文件上传功能...')
    
    // 创建一个测试文件内容
    const testContent = 'This is a test file for upload functionality'
    const testFileName = `test-${Date.now()}.txt`
    const filePath = `test/${testFileName}`
    
    console.log(`上传测试文件: ${testFileName}`)
    
    // 上传文件到files存储桶
    const { data, error } = await supabase.storage
      .from('files')
      .upload(filePath, Buffer.from(testContent), {
        contentType: 'text/plain',
        upsert: false
      })
    
    if (error) {
      console.error('❌ 文件上传失败:', error)
      return false
    }
    
    console.log('✅ 文件上传成功')
    console.log('上传结果:', data)
    
    // 获取公共URL
    const { data: urlData } = supabase.storage
      .from('files')
      .getPublicUrl(filePath)
    
    console.log('✅ 获取公共URL成功')
    console.log('文件URL:', urlData.publicUrl)
    
    // 测试文件列表
    const { data: listData, error: listError } = await supabase.storage
      .from('files')
      .list('test', {
        limit: 10,
        offset: 0
      })
    
    if (listError) {
      console.error('❌ 获取文件列表失败:', listError)
    } else {
      console.log('✅ 获取文件列表成功')
      console.log('文件列表:', listData)
    }
    
    // 清理测试文件
    console.log('\n正在清理测试文件...')
    const { error: deleteError } = await supabase.storage
      .from('files')
      .remove([filePath])
    
    if (deleteError) {
      console.error('⚠️  删除测试文件失败:', deleteError)
    } else {
      console.log('✅ 测试文件清理完成')
    }
    
    return true
    
  } catch (error) {
    console.error('测试过程中发生错误:', error)
    return false
  }
}

async function testBucketAccess() {
  try {
    console.log('\n正在测试存储桶访问权限...')
    
    // 获取存储桶信息
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('❌ 获取存储桶失败:', error)
      return false
    }
    
    const filesBucket = buckets.find(bucket => bucket.name === 'files')
    if (!filesBucket) {
      console.error('❌ 未找到files存储桶')
      return false
    }
    
    console.log('✅ files存储桶访问正常')
    console.log('存储桶信息:')
    console.log(`- 名称: ${filesBucket.name}`)
    console.log(`- 公开: ${filesBucket.public}`)
    console.log(`- 创建时间: ${filesBucket.created_at}`)
    
    return true
    
  } catch (error) {
    console.error('测试存储桶访问时发生错误:', error)
    return false
  }
}

// 执行测试
async function main() {
  console.log('=== Supabase文件上传功能测试 ===')
  
  const bucketAccessOk = await testBucketAccess()
  if (!bucketAccessOk) {
    console.log('\n❌ 存储桶访问测试失败')
    process.exit(1)
  }
  
  const uploadOk = await testFileUpload()
  if (uploadOk) {
    console.log('\n🎉 所有测试通过！文件上传功能正常')
    process.exit(0)
  } else {
    console.log('\n❌ 文件上传测试失败')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('测试脚本执行失败:', error)
  process.exit(1)
})