const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.development') });

const setupDatabase = async () => {
  console.log('🚀 Iniciando setup do banco de dados...');
  
  // Configuração do banco
  const config = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: 'postgres' // Conecta ao banco padrão primeiro
  };

  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');
    
    // Criar banco de dados se não existir
    const dbName = process.env.DATABASE_NAME || 'grifo_dev';
    
    try {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Banco de dados '${dbName}' criado`);
    } catch (error) {
      if (error.code === '42P04') {
        console.log(`ℹ️  Banco de dados '${dbName}' já existe`);
      } else {
        throw error;
      }
    }
    
    await client.end();
    
    // Conectar ao banco específico e executar schema
    const dbClient = new Client({
      ...config,
      database: dbName
    });
    
    await dbClient.connect();
    console.log(`✅ Conectado ao banco '${dbName}'`);
    
    // Ler e executar schema SQL
    const schemaPath = path.resolve(__dirname, '../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    await dbClient.query(schemaSql);
    console.log('✅ Schema do banco de dados aplicado com sucesso');
    
    // Inserir dados de exemplo (opcional)
    const insertExampleData = process.argv.includes('--with-data');
    
    if (insertExampleData) {
      console.log('📝 Inserindo dados de exemplo...');
      
      // Empresa de exemplo
      const empresaResult = await dbClient.query(`
        INSERT INTO empresas (nome, cnpj, email, telefone) 
        VALUES ('Grifo Vistorias Demo', '12.345.678/0001-90', 'demo@grifovistorias.com', '(11) 99999-9999')
        ON CONFLICT (cnpj) DO NOTHING
        RETURNING id
      `);
      
      if (empresaResult.rows.length > 0) {
        const empresaId = empresaResult.rows[0].id;
        console.log(`✅ Empresa demo criada: ${empresaId}`);
        
        // Usuário admin de exemplo
        await dbClient.query(`
          INSERT INTO usuarios (firebase_uid, empresa_id, email, nome, role) 
          VALUES ('demo-admin-uid', $1, 'admin@grifovistorias.com', 'Admin Demo', 'admin')
          ON CONFLICT (firebase_uid) DO NOTHING
        `, [empresaId]);
        
        console.log('✅ Usuário admin demo criado');
        
        // Propriedade de exemplo
        await dbClient.query(`
          INSERT INTO propriedades (empresa_id, endereco, tipo) 
          VALUES ($1, $2, 'Residencial')
        `, [empresaId, JSON.stringify({
          street: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567'
        })]);
        
        console.log('✅ Propriedade demo criada');
      }
    }
    
    await dbClient.end();
    console.log('🎉 Setup do banco de dados concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o setup:', error.message);
    console.error('📋 Detalhes do erro:', error);
    console.error('🔍 Stack trace:', error.stack);
    process.exit(1);
  }
};

// Executar setup
setupDatabase();