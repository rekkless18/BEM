/**
 * 检查Supabase存储桶脚本
 * 用于查看项目中现有的存储桶
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少Supabase配置')
  console.error('请确保.env文件中包含:')
  console.error('- SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// 创建Supabase客户端（使用service role key以获得管理权限）
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkStorageBuckets() {
  try {
    console.log('正在检查Supabase存储桶...')
    
    // 获取所有存储桶
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('获取存储桶列表失败:', error)
      return
    }
    
    console.log('\n=== 存储桶列表 ===')
    if (buckets && buckets.length > 0) {
      buckets.forEach((bucket, index) => {
        console.log(`${index + 1}. 桶名: ${bucket.name}`)
        console.log(`   ID: ${bucket.id}`)
        console.log(`   创建时间: ${bucket.created_at}`)
        console.log(`   更新时间: ${bucket.updated_at}`)
        console.log(`   公开: ${bucket.public}`)
        console.log('---')
      })
      
      // 检查是否存在'files'桶
      const filesBucket = buckets.find(bucket => bucket.name === 'files')
      if (filesBucket) {
        console.log('✅ 找到\'files\'存储桶')
      } else {
        console.log('❌ 未找到\'files\'存储桶，需要创建')
      }
    } else {
      console.log('未找到任何存储桶')
    }
    
  } catch (error) {
    console.error('检查存储桶时发生错误:', error)
  }
}

// 执行检查
checkStorageBuckets()
  .then(() => {
    console.log('\n检查完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('脚本执行失败:', error)
    process.exit(1)
  })