require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 3070;

// Configuración de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware de depuración para todas las solicitudes
app.use((req, res, next) => {
  console.log(`[SERVER] ${req.method} ${req.path}`);
  next();
});

// Configuración del servidor
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Ruta principal
app.get('/', (req, res) => {
  console.log('[SERVER] Sirviendo página principal');
  res.render('index');
});

// Generar caso de estudio
app.post('/generate-case', async (req, res) => {
  console.log('[SERVER] /generate-case - Inicio');
  console.log('[SERVER] Body recibido:', JSON.stringify(req.body, null, 2));

  try {
    if (!req.body.topic) {
      console.error('[SERVER] Error: Campo "topic" faltante');
      return res.status(400).json({ 
        status: 'error',
        error: 'El campo "topic" es requerido'
      });
    }

    const prompt = `Genera un caso de estudio detallado sobre ${req.body.topic} que incluya:
    - Contexto de la organización
    - Identificación de riesgos
    - Análisis de riesgos
    - Evaluación de riesgos
    - Posibles tratamientos de riesgo
    - Relación con la norma ISO 31000
    
    El caso debe ser realista y adecuado para un análisis profesional,
    el caso de estudio debe tener un nombre para la empresa muy creativo no debe ser empresa XYZ o lugar XYZ debe tener un nombre creativo además
   no debe sobrepasar los 200 caracteres y debe ser claro y conciso.`;

    console.log('[SERVER] Prompt creado:', prompt.substring(0, 150) + '...');

    console.log('[SERVER] Enviando solicitud a OpenAI...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Eres un experto en gestión de riesgos de TI y normas ISO." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 250
    });

    const caseStudy = completion.choices[0].message.content;
    console.log('[SERVER] Caso de estudio generado (primeros 100 caracteres):', caseStudy.substring(0, 100) + '...');

    res.json({ 
      status: 'success',
      caseStudy: caseStudy 
    });
  } catch (error) {
    console.error('[SERVER] Error en /generate-case:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Error al generar el caso de estudio',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Generar respuesta de IA
app.post('/generate-ai-response', async (req, res) => {
  console.log('[SERVER] /generate-ai-response - Inicio');
  
  try {
    if (!req.body.caseStudy) {
      console.error('[SERVER] Error: Campo "caseStudy" faltante');
      return res.status(400).json({ 
        status: 'error',
        error: 'El campo "caseStudy" es requerido'
      });
    }

    const prompt = `Analiza el siguiente caso de estudio sobre gestión de riesgos y proporciona una respuesta profesional que no sobrepase la extensión de 400 caracteres y que incluya:
    - Identificación de los principales riesgos
    - Análisis de impacto y probabilidad
    - Recomendaciones de tratamiento según ISO 31000
    - Plan de acción sugerido
    
    Caso de estudio:
    ${req.body.caseStudy}`;

    console.log('[SERVER] Enviando solicitud a OpenAI para respuesta...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Eres un consultor experto en gestión de riesgos de TI." },
        { role: "user", content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 480
    });

    const aiResponse = completion.choices[0].message.content;
    console.log('[SERVER] Respuesta de IA generada (primeros 100 caracteres):', aiResponse.substring(0, 100) + '...');

    res.json({ 
      status: 'success',
      aiResponse: aiResponse 
    });
  } catch (error) {
    console.error('[SERVER] Error en /generate-ai-response:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Error al generar la respuesta de IA',
      details: error.message
    });
  }
});

// Comparar respuestas
app.post('/compare-responses', async (req, res) => {
    console.log('[SERVER] /compare-responses - Inicio');
    
    try {
      const requiredFields = ['userResponse', 'aiResponse', 'caseStudy'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        console.error('[SERVER] Campos faltantes:', missingFields);
        return res.status(400).json({ 
          status: 'error',
          error: 'Campos requeridos faltantes',
          missingFields: missingFields
        });
      }
  
      const prompt = `Compara las siguientes dos respuestas a un caso de estudio sobre gestión de riesgos según ISO 31000 y devuelve un análisis en formato JSON válido con las siguientes claves: patterns, similarities, differences, reliability. Si algún campo no aplica, usa "No disponible" como valor.
      
      Caso de estudio:
      ${req.body.caseStudy}
      
      Respuesta del usuario:
      ${req.body.userResponse}
      
      Respuesta de la IA:
      ${req.body.aiResponse}
      
      El formato de respuesta debe ser exactamente este:
      {
        "patterns": "texto descriptivo o 'No disponible'",
        "similarities": "texto descriptivo o 'No disponible'",
        "differences": "texto descriptivo o 'No disponible'",
        "reliability": "texto descriptivo o 'No disponible'"
      }`;
  
      console.log('[SERVER] Enviando solicitud de comparación a OpenAI...');
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [
          { 
            role: "system", 
            content: "Eres un analista experto. Devuelve ÚNICAMENTE un JSON válido con los 4 campos requeridos, usando 'No disponible' si no hay datos." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      });
  
      let responseContent = completion.choices[0].message.content;
      console.log('[SERVER] Respuesta cruda de OpenAI:', responseContent);
  
      // Limpieza del JSON
      const jsonStart = responseContent.indexOf('{');
      const jsonEnd = responseContent.lastIndexOf('}') + 1;
      const jsonString = responseContent.slice(jsonStart, jsonEnd);
  
      let analysis;
      try {
        analysis = JSON.parse(jsonString);
      } catch (error) {
        console.error('[SERVER] Error al parsear JSON:', error);
        throw new Error('La respuesta no es un JSON válido');
      }
  
      // Validar campos con valores por defecto
      const defaultAnalysis = {
        patterns: "No se identificaron patrones",
        similarities: "No se encontraron similitudes",
        differences: "No se encontraron diferencias",
        reliability: "No se pudo evaluar la confiabilidad"
      };
  
      const finalAnalysis = {
        patterns: analysis.patterns || defaultAnalysis.patterns,
        similarities: analysis.similarities || defaultAnalysis.similarities,
        differences: analysis.differences || defaultAnalysis.differences,
        reliability: analysis.reliability || defaultAnalysis.reliability
      };
  
      console.log('[SERVER] Análisis final:', finalAnalysis);
      res.json({ 
        status: 'success',
        ...finalAnalysis
      });
    } catch (error) {
      console.error('[SERVER] Error en /compare-responses:', error);
      res.status(500).json({ 
        status: 'error',
        error: 'Error al comparar las respuestas',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

// Ruta para la página de comparación
app.get('/compare', (req, res) => {
  console.log('[SERVER] /compare - Parámetros recibidos:', req.query);
  res.render('compare', {
    userResponse: decodeURIComponent(req.query.userResponse),
    aiResponse: decodeURIComponent(req.query.aiResponse),
    patterns: decodeURIComponent(req.query.patterns),
    similarities: decodeURIComponent(req.query.similarities),
    differences: decodeURIComponent(req.query.differences),
    reliability: decodeURIComponent(req.query.reliability)
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('[SERVER] Error no manejado:', err);
  res.status(500).send('Error interno del servidor');
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`[SERVER] Servidor corriendo en http://localhost:${port}`);
  console.log('[SERVER] OpenAI configurado:', openai.apiKey ? 'Sí' : 'No');
});
