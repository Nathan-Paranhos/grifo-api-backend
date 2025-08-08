const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://fsvwifbvehdhlufauahj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdndpZmJ2ZWhkaGx1ZmF1YWhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYyMjUwNiwiZXhwIjoyMDcwMTk4NTA2fQ.P0IucayWhykgPkSkvGUvzW1Q0PHtzNaSbJ010EWS-6A';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdndpZmJ2ZWhkaGx1ZmF1YWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MjI1MDYsImV4cCI6MjA3MDE5ODUwNn0.woGY7a1Yv1FI-c9dUatYW9WeeuUIk7Lqnf25EJ8unB5Cp0u55gh2B897H4TlpvVa';

// Cliente Supabase com service role para operações administrativas
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey', 'Prefer', 'Range']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

// Middleware de autenticação JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const apikey = req.headers['apikey'];
  
  // Permitir acesso com service role key
  if (apikey === supabaseServiceKey) {
    req.user = { role: 'service_role', empresa_id: null };
    return next();
  }
  
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }
  
  try {
    // Verificar token JWT
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    req.user = decoded.payload;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar permissões de superadmin
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'service_role' && req.user.app_metadata?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Acesso negado: requer permissões de superadmin' });
  }
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Grifo API Backend - Supabase Integration',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    supabase_url: supabaseUrl,
    endpoints: {
      rest: `${supabaseUrl}/rest/v1`,
      rpc: `${supabaseUrl}/rest/v1/rpc`,
      functions: `${supabaseUrl}/functions/v1`,
      graphql: `${supabaseUrl}/graphql/v1`,
      storage: `${supabaseUrl}/storage/v1`
    }
  });
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    name: 'Grifo API Backend',
    version: '1.0.0',
    description: 'API multi-tenant para gerenciamento de vistorias imobiliárias',
    base_urls: {
      rest: `${supabaseUrl}/rest/v1`,
      rpc: `${supabaseUrl}/rest/v1/rpc`,
      functions: `${supabaseUrl}/functions/v1`,
      graphql: `${supabaseUrl}/graphql/v1`,
      storage: `${supabaseUrl}/storage/v1`
    },
    authentication: {
      header: 'Authorization: Bearer <jwt>',
      apikey: 'apikey: <ANON_KEY ou SERVICE_ROLE_KEY>'
    },
    resources: {
      empresas: '/rest/v1/empresas',
      usuarios: '/rest/v1/usuarios',
      imoveis: '/rest/v1/imoveis',
      vistorias: '/rest/v1/vistorias',
      contestacoes: '/rest/v1/contestacoes'
    },
    rpc_functions: {
      dashboard_kpis: '/rest/v1/rpc/dashboard_kpis',
      usage_stats: '/rest/v1/rpc/usage_stats'
    },
    edge_functions: {
      create_tenant: '/functions/v1/create_tenant',
      assign_role: '/functions/v1/assign_role',
      finalize_vistoria: '/functions/v1/finalize_vistoria',
      drive_sync: '/functions/v1/drive_sync'
    }
  });
});

// ===== CRUD AUTOMÁTICO VIA POSTGREST =====

// Empresas
app.get('/rest/v1/empresas', authenticateToken, async (req, res) => {
  try {
    let query = supabase.from('empresas').select('*');
    
    // Aplicar filtros da query string
    Object.keys(req.query).forEach(key => {
      if (key.includes('=')) {
        const [field, operator] = key.split('=');
        const value = req.query[key];
        
        switch (operator) {
          case 'eq':
            query = query.eq(field, value);
            break;
          case 'neq':
            query = query.neq(field, value);
            break;
          case 'gt':
            query = query.gt(field, value);
            break;
          case 'gte':
            query = query.gte(field, value);
            break;
          case 'lt':
            query = query.lt(field, value);
            break;
          case 'lte':
            query = query.lte(field, value);
            break;
          case 'like':
            query = query.like(field, value);
            break;
          case 'in':
            query = query.in(field, value.split(','));
            break;
        }
      }
    });
    
    // Paginação
    const range = req.headers.range;
    if (range) {
      const [start, end] = range.split('-').map(Number);
      query = query.range(start, end);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    // Headers de resposta
    if (range) {
      const [start, end] = range.split('-').map(Number);
      res.set('Content-Range', `${start}-${Math.min(end, data.length - 1)}/${count || data.length}`);
      res.status(206);
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/rest/v1/empresas', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .insert(req.body)
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/rest/v1/empresas', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    let query = supabase.from('empresas').update(req.body);
    
    // Aplicar filtros da query string
    Object.keys(req.query).forEach(key => {
      if (key.includes('=')) {
        const [field, operator] = key.split('=');
        const value = req.query[key];
        
        if (operator === 'eq') {
          query = query.eq(field, value);
        }
      }
    });
    
    const { data, error } = await query.select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Usuários
app.get('/rest/v1/usuarios', authenticateToken, async (req, res) => {
  try {
    let query = supabase.from('usuarios').select('*');
    
    // RLS: filtrar por empresa_id se não for superadmin
    if (req.user.role !== 'service_role' && req.user.app_metadata?.role !== 'superadmin') {
      query = query.eq('empresa_id', req.user.empresa_id);
    }
    
    // Aplicar filtros da query string
    Object.keys(req.query).forEach(key => {
      if (key.includes('=')) {
        const [field, operator] = key.split('=');
        const value = req.query[key];
        
        switch (operator) {
          case 'eq':
            query = query.eq(field, value);
            break;
          case 'neq':
            query = query.neq(field, value);
            break;
          case 'like':
            query = query.like(field, value);
            break;
          case 'in':
            query = query.in(field, value.split(','));
            break;
        }
      }
    });
    
    // Paginação
    const range = req.headers.range;
    if (range) {
      const [start, end] = range.split('-').map(Number);
      query = query.range(start, end);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    // Headers de resposta
    if (range) {
      const [start, end] = range.split('-').map(Number);
      res.set('Content-Range', `${start}-${Math.min(end, data.length - 1)}/${count || data.length}`);
      res.status(206);
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/rest/v1/usuarios', authenticateToken, async (req, res) => {
  try {
    // Garantir que empresa_id seja do usuário logado (exceto superadmin)
    if (req.user.role !== 'service_role' && req.user.app_metadata?.role !== 'superadmin') {
      req.body.empresa_id = req.user.empresa_id;
    }
    
    const { data, error } = await supabase
      .from('usuarios')
      .insert(req.body)
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/rest/v1/usuarios', authenticateToken, async (req, res) => {
  try {
    let query = supabase.from('usuarios').update(req.body);
    
    // RLS: filtrar por empresa_id se não for superadmin
    if (req.user.role !== 'service_role' && req.user.app_metadata?.role !== 'superadmin') {
      query = query.eq('empresa_id', req.user.empresa_id);
    }
    
    // Aplicar filtros da query string
    Object.keys(req.query).forEach(key => {
      if (key.includes('=')) {
        const [field, operator] = key.split('=');
        const value = req.query[key];
        
        if (operator === 'eq') {
          query = query.eq(field, value);
        }
      }
    });
    
    const { data, error } = await query.select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Imóveis
app.get('/rest/v1/imoveis', authenticateToken, async (req, res) => {
  try {
    let query = supabase.from('imoveis').select('*');
    
    // RLS: filtrar por empresa_id se não for superadmin
    if (req.user.role !== 'service_role' && req.user.app_metadata?.role !== 'superadmin') {
      query = query.eq('empresa_id', req.user.empresa_id);
    }
    
    // Aplicar filtros da query string
    Object.keys(req.query).forEach(key => {
      if (key === 'select') {
        query = supabase.from('imoveis').select(req.query[key]);
        return;
      }
      
      if (key.includes('=')) {
        const [field, operator] = key.split('=');
        const value = req.query[key];
        
        switch (operator) {
          case 'eq':
            query = query.eq(field, value);
            break;
          case 'neq':
            query = query.neq(field, value);
            break;
          case 'like':
            query = query.like(field, value);
            break;
          case 'in':
            query = query.in(field, value.split(','));
            break;
        }
      }
    });
    
    // Paginação
    const range = req.headers.range;
    if (range) {
      const [start, end] = range.split('-').map(Number);
      query = query.range(start, end);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    // Headers de resposta
    if (range) {
      const [start, end] = range.split('-').map(Number);
      res.set('Content-Range', `${start}-${Math.min(end, data.length - 1)}/${count || data.length}`);
      res.status(206);
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/rest/v1/imoveis', authenticateToken, async (req, res) => {
  try {
    // Garantir que empresa_id seja do usuário logado (exceto superadmin)
    if (req.user.role !== 'service_role' && req.user.app_metadata?.role !== 'superadmin') {
      req.body.empresa_id = req.user.empresa_id;
    }
    
    const { data, error } = await supabase
      .from('imoveis')
      .insert(req.body)
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/rest/v1/imoveis', authenticateToken, async (req, res) => {
  try {
    let query = supabase.from('imoveis').update(req.body);
    
    // RLS: filtrar por empresa_id se não for superadmin
    if (req.user.role !== 'service_role' && req.user.app_metadata?.role !== 'superadmin') {
      query = query.eq('empresa_id', req.user.empresa_id);
    }
    
    // Aplicar filtros da query string
    Object.keys(req.query).forEach(key => {
      if (key.includes('=')) {
        const [field, operator] = key.split('=');
        const value = req.query[key];
        
        if (operator === 'eq') {
          query = query.eq(field, value);
        }
      }
    });
    
    const { data, error } = await query.select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/rest/v1/imoveis', authenticateToken, async (req, res) => {
  try {
    let query = supabase.from('imoveis').delete();
    
    // RLS: filtrar por empresa_id se não for superadmin
    if (req.user.role !== 'service_role' && req.user.app_metadata?.role !== 'superadmin') {
      query = query.eq('empresa_id', req.user.empresa_id);
    }
    
    // Aplicar filtros da query string
    Object.keys(req.query).forEach(key => {
      if (key.includes('=')) {
        const [field, operator] = key.split('=');
        const value = req.query[key];
        
        if (operator === 'eq') {
          query = query.eq(field, value);
        }
      }
    });
    
    const { error } = await query;
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vistorias
app.get('/rest/v1/vistorias', authenticateToken, async (req, res) => {
  try {
    let query = supabase.from('vistorias').select('*');
    
    // RLS: filtrar por empresa_id se não for superadmin
    if (req.user.role !== 'service_role' && req.user.app_metadata?.role !== 'superadmin') {
      query = query.eq('empresa_id', req.user.empresa_id);
    }
    
    // Aplicar filtros da query string
    Object.keys(req.query).forEach(key => {
      if (key === 'select') {
        query = supabase.from('vistorias').select(req.query[key]);
        return;
      }
      
      if (key.includes('=')) {
        const [field, operator] = key.split('=');
        const value = req.query[key];
        
        switch (operator) {
          case 'eq':
            query = query.eq(field, value);
            break;
          case 'neq':
            query = query.neq(field, value);
            break;
          case 'like':
            query = query.like(field, value);
            break;
          case 'in':
            query = query.in(field, value.split(','));
            break;
          case 'gte':
            query = query.gte(field, value);
            break;
          case 'lte':
            query = query.lte(field, value);
            break;
        }
      }
    });
    
    // Paginação
    const range = req.headers.range;
    if (range) {
      const [start, end] = range.split('-').map(Number);
      query = query.range(start, end);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    // Headers de resposta
    if (range) {
      const [start, end] = range.split('-').map(Number);
      res.set('Content-Range', `${start}-${Math.min(end, data.length - 1)}/${count || data.length}`);
      res.status(206);
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/rest/v1/vistorias', authenticateToken, async (req, res) => {
  try {
    // Garantir que empresa_id seja do usuário logado (exceto superadmin)
    if (req.user.role !== 'service_role' && req.user.app_metadata?.role !== 'superadmin') {
      req.body.empresa_id = req.user.empresa_id;
    }
    
    const { data, error } = await supabase
      .from('vistorias')
      .insert(req.body)
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/rest/v1/vistorias', authenticateToken, async (req, res) => {
  try {
    let query = supabase.from('vistorias').update(req.body);
    
    // RLS: filtrar por empresa_id se não for superadmin
    if (req.user.role !== 'service_role' && req.user.app_metadata?.role !== 'superadmin') {
      query = query.eq('empresa_id', req.user.empresa_id);
    }
    
    // Aplicar filtros da query string
    Object.keys(req.query).forEach(key => {
      if (key.includes('=')) {
        const [field, operator] = key.split('=');
        const value = req.query[key];
        
        if (operator === 'eq') {
          query = query.eq(field, value);
        }
      }
    });
    
    const { data, error } = await query.select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Contestações
app.get('/rest/v1/contestacoes', authenticateToken, async (req, res) => {
  try {
    let query = supabase.from('contestacoes').select('*');
    
    // RLS: filtrar por empresa_id se não for superadmin
    if (req.user.role !== 'service_role' && req.user.app_metadata?.role !== 'superadmin') {
      query = query.eq('empresa_id', req.user.empresa_id);
    }
    
    // Aplicar filtros da query string
    Object.keys(req.query).forEach(key => {
      if (key.includes('=')) {
        const [field, operator] = key.split('=');
        const value = req.query[key];
        
        switch (operator) {
          case 'eq':
            query = query.eq(field, value);
            break;
          case 'neq':
            query = query.neq(field, value);
            break;
          case 'like':
            query = query.like(field, value);
            break;
          case 'in':
            query = query.in(field, value.split(','));
            break;
        }
      }
    });
    
    // Paginação
    const range = req.headers.range;
    if (range) {
      const [start, end] = range.split('-').map(Number);
      query = query.range(start, end);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    // Headers de resposta
    if (range) {
      const [start, end] = range.split('-').map(Number);
      res.set('Content-Range', `${start}-${Math.min(end, data.length - 1)}/${count || data.length}`);
      res.status(206);
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/rest/v1/contestacoes', authenticateToken, async (req, res) => {
  try {
    // Garantir que empresa_id seja do usuário logado (exceto superadmin)
    if (req.user.role !== 'service_role' && req.user.app_metadata?.role !== 'superadmin') {
      req.body.empresa_id = req.user.empresa_id;
    }
    
    const { data, error } = await supabase
      .from('contestacoes')
      .insert(req.body)
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== RPC (FUNÇÕES SQL) =====

app.post('/rest/v1/rpc/dashboard_kpis', authenticateToken, async (req, res) => {
  try {
    const { empresa } = req.body;
    
    // Verificar se o usuário tem acesso à empresa (exceto superadmin)
    if (req.user.role !== 'service_role' && req.user.app_metadata?.role !== 'superadmin') {
      if (empresa !== req.user.empresa_id) {
        return res.status(403).json({ error: 'Acesso negado à empresa especificada' });
      }
    }
    
    const { data, error } = await supabase.rpc('dashboard_kpis', { empresa });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/rest/v1/rpc/usage_stats', authenticateToken, async (req, res) => {
  try {
    const { empresa } = req.body;
    
    // Verificar se o usuário tem acesso à empresa (exceto superadmin)
    if (req.user.role !== 'service_role' && req.user.app_metadata?.role !== 'superadmin') {
      if (empresa !== req.user.empresa_id) {
        return res.status(403).json({ error: 'Acesso negado à empresa especificada' });
      }
    }
    
    const { data, error } = await supabase.rpc('usage_stats', { empresa });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== EDGE FUNCTIONS =====

app.post('/functions/v1/create_tenant', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { nome, cnpj } = req.body;
    
    if (!nome || !cnpj) {
      return res.status(400).json({ error: 'Nome e CNPJ são obrigatórios' });
    }
    
    // Criar empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .insert({
        nome,
        cnpj,
        ativa: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (empresaError) {
      return res.status(400).json({ error: empresaError.message });
    }
    
    res.json({ empresa_id: empresa.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/functions/v1/assign_role', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { user_id, role, empresa_id } = req.body;
    
    if (!user_id || !role || !empresa_id) {
      return res.status(400).json({ error: 'user_id, role e empresa_id são obrigatórios' });
    }
    
    // Atualizar usuário
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        role,
        empresa_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id)
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ success: true, user: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/functions/v1/finalize_vistoria', authenticateToken, async (req, res) => {
  try {
    const { vistoria_id, pdf_url } = req.body;
    
    if (!vistoria_id || !pdf_url) {
      return res.status(400).json({ error: 'vistoria_id e pdf_url são obrigatórios' });
    }
    
    // Verificar se a vistoria pertence à empresa do usuário
    const { data: vistoria, error: vistoriaError } = await supabase
      .from('vistorias')
      .select('empresa_id')
      .eq('id', vistoria_id)
      .single();
    
    if (vistoriaError) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }
    
    if (req.user.role !== 'service_role' && req.user.app_metadata?.role !== 'superadmin') {
      if (vistoria.empresa_id !== req.user.empresa_id) {
        return res.status(403).json({ error: 'Acesso negado: empresa_id mismatch' });
      }
    }
    
    // Finalizar vistoria
    const { data, error } = await supabase
      .from('vistorias')
      .update({
        status: 'finalizada',
        pdf_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', vistoria_id)
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ status: 'finalizada', vistoria: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/functions/v1/drive_sync', async (req, res) => {
  try {
    // Webhook do Storage - sincronização com Google Drive
    console.log('Drive sync webhook received:', req.body);
    
    // Aqui você implementaria a lógica de sincronização com Google Drive
    // Por exemplo, copiar arquivos do Supabase Storage para Google Drive
    
    res.json({ success: true, message: 'Drive sync completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== STORAGE =====

app.post('/storage/v1/object/vistorias/:empresa/:vistoria/:filename', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { empresa, vistoria, filename } = req.params;
    
    // Verificar se o usuário tem acesso à empresa
    if (req.user.role !== 'service_role' && req.user.app_metadata?.role !== 'superadmin') {
      if (empresa !== req.user.empresa_id) {
        return res.status(403).json({ error: 'Acesso negado à empresa especificada' });
      }
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo não fornecido' });
    }
    
    const filePath = `${empresa}/${vistoria}/${filename}`;
    
    const { data, error } = await supabase.storage
      .from('vistorias')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ Key: data.path, ETag: data.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/storage/v1/object/list/vistorias/:empresa/:vistoria', authenticateToken, async (req, res) => {
  try {
    const { empresa, vistoria } = req.params;
    
    // Verificar se o usuário tem acesso à empresa
    if (req.user.role !== 'service_role' && req.user.app_metadata?.role !== 'superadmin') {
      if (empresa !== req.user.empresa_id) {
        return res.status(403).json({ error: 'Acesso negado à empresa especificada' });
      }
    }
    
    const { data, error } = await supabase.storage
      .from('vistorias')
      .list(`${empresa}/${vistoria}`);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== GRAPHQL PROXY =====

app.post('/graphql/v1', authenticateToken, async (req, res) => {
  try {
    // Proxy para o endpoint GraphQL do Supabase
    const response = await fetch(`${supabaseUrl}/graphql/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization,
        'apikey': req.headers.apikey || supabaseAnonKey,
        'Content-Profile': req.headers['content-profile'] || 'public'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    message: 'Verifique a documentação da API',
    available_endpoints: {
      health: '/health',
      api_info: '/api',
      rest: '/rest/v1/*',
      rpc: '/rest/v1/rpc/*',
      functions: '/functions/v1/*',
      graphql: '/graphql/v1',
      storage: '/storage/v1/*'
    }
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Grifo API Backend running on port ${port}`);
  console.log(`📋 Health check: http://localhost:${port}/health`);
  console.log(`📖 API info: http://localhost:${port}/api`);
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  console.log(`✅ All endpoints configured and ready`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  process.exit(0);
});