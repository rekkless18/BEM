// 检查doctors表的RLS策略
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDoctorsRLS() {
  try {
    console.log('检查doctors表的RLS策略...');
    
    // 查询RLS策略
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            schemaname, 
            tablename, 
            policyname, 
            permissive, 
            roles, 
            cmd, 
            qual 
          FROM pg_policies 
          WHERE tablename = 'doctors';
        `
      });
    
    if (policiesError) {
      console.error('查询RLS策略失败:', policiesError);
      
      // 尝试直接查询
      const { data: directQuery, error: directError } = await supabase
        .from('information_schema.role_table_grants')
        .select('*')
        .eq('table_name', 'doctors');
        
      if (directError) {
        console.error('直接查询权限失败:', directError);
      } else {
        console.log('doctors表的权限信息:', directQuery);
      }
    } else {
      console.log('doctors表的RLS策略:', policies);
    }
    
    // 检查表是否启用了RLS
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity
          FROM pg_tables 
          WHERE tablename = 'doctors';
        `
      });
      
    if (tableError) {
      console.error('查询表信息失败:', tableError);
    } else {
      console.log('doctors表信息:', tableInfo);
    }
    
  } catch (error) {
    console.error('检查失败:', error);
  }
}

checkDoctorsRLS().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('执行失败:', err);
  process.exit(1);
});