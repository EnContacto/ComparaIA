require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
const pdf = require('html-pdf');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3070;

// Configuración de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middlewares
app.use(cors());
app.use((req, res, next) => {
  console.log(`[SERVER] ${req.method} ${req.path}`);
  next();
});

// Configuración del servidor
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Crear directorio para PDFs
const pdfDir = path.join(__dirname, 'public', 'pdfs');
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

// Rutas
app.get('/', (req, res) => {
  console.log('[SERVER] Sirviendo página principal');
  res.render('index');
});

// Generar caso de estudio
app.post('/generate-case', async (req, res) => {
  console.log('[SERVER] /generate-case - Inicio');
  
  try {
    if (!req.body.topic) {
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
    esta empresa ficticia debe tener un nombre creativo no uses empresa XYZ además 
    no debe sobrepasar los 350 caracteres y debe ser claro y conciso.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Eres un experto en gestión de riesgos de TI y normas ISO." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    const caseStudy = completion.choices[0].message.content;
    
    res.json({ 
      status: 'success',
      caseStudy: caseStudy 
    });
  } catch (error) {
    console.error('[SERVER] Error en /generate-case:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Error al generar el caso de estudio',
      details: error.message
    });
  }
});

// Generar respuesta de IA
app.post('/generate-ai-response', async (req, res) => {
  console.log('[SERVER] /generate-ai-response - Inicio');
  
  try {
    if (!req.body.caseStudy) {
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

// Generar PDF del caso de estudio
app.post('/generate-case-pdf', async (req, res) => {
  try {
    const { caseStudy } = req.body;
    
    if (!caseStudy) {
      return res.status(400).json({ error: 'Caso de estudio requerido' });
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Caso de Estudio ISO 31000</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
          h1 { color: #2c3e50; text-align: center; }
          .content { margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Caso de Estudio ISO 31000</h1>
        <div class="content">${caseStudy}</div>
      </body>
      </html>
    `;

    const options = {
      format: 'A4',
      border: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    };

    const filename = `caso-estudio-${Date.now()}.pdf`;
    const filepath = path.join(pdfDir, filename);

    pdf.create(html, options).toFile(filepath, (err, result) => {
      if (err) {
        console.error('[SERVER] Error al generar PDF:', err);
        return res.status(500).json({ error: 'Error al generar PDF' });
      }
      res.json({ 
        status: 'success',
        pdfUrl: `/pdfs/${filename}` 
      });
    });
  } catch (error) {
    console.error('[SERVER] Error en /generate-case-pdf:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Generar PDF del análisis comparativo
app.post('/generate-analysis-pdf', async (req, res) => {
  try {
    const { userResponse, aiResponse, comparison } = req.body;
    
    if (!userResponse || !aiResponse || !comparison) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Análisis Comparativo ISO 31000</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
          h1 { color: #2c3e50; text-align: center; }
          .section { margin-bottom: 30px; }
          .response-box { 
            border: 1px solid #ddd; 
            padding: 15px; 
            margin-bottom: 20px;
            border-radius: 5px;
          }
          .similarity-star {
            text-align: center;
            font-size: 24px;
            color: #f1c40f;
            margin: 20px 0;
          }
          .analysis-item {
            margin-bottom: 15px;
          }
          .analysis-item h3 {
            color: #3498db;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <h1>Análisis Comparativo ISO 31000</h1>
        
        <div class="section">
          <h2>Respuestas</h2>
          <div class="response-box">
            <h3>Tu Respuesta</h3>
            <p>${userResponse}</p>
          </div>
          
          <div class="response-box">
            <h3>Respuesta de la IA</h3>
            <p>${aiResponse}</p>
          </div>
        </div>
        
        <div class="section">
          <h2>Análisis Comparativo</h2>
          
          <div class="similarity-star">
            ★ Similitud: ${comparison.similarityPercentage || 'No disponible'} ★
          </div>
          
          <div class="analysis-item">
            <h3>Patrones identificados</h3>
            <p>${comparison.patterns || 'No disponible'}</p>
          </div>
          
          <div class="analysis-item">
            <h3>Similitudes clave</h3>
            <p>${comparison.similarities || 'No disponible'}</p>
          </div>
          
          <div class="analysis-item">
            <h3>Diferencias significativas</h3>
            <p>${comparison.differences || 'No disponible'}</p>
          </div>
          
          <div class="analysis-item">
            <h3>Evaluación de Confiabilidad</h3>
            <p>${comparison.reliability || 'No disponible'}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const options = {
      format: 'A4',
      border: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    };

    const filename = `analisis-comparativo-${Date.now()}.pdf`;
    const filepath = path.join(pdfDir, filename);

    pdf.create(html, options).toFile(filepath, (err, result) => {
      if (err) {
        console.error('[SERVER] Error al generar PDF:', err);
        return res.status(500).json({ error: 'Error al generar PDF' });
      }
      res.json({ 
        status: 'success',
        pdfUrl: `/pdfs/${filename}` 
      });
    });
  } catch (error) {
    console.error('[SERVER] Error en /generate-analysis-pdf:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
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

    const prompt = `Compara las siguientes dos respuestas a un caso de estudio sobre gestión de riesgos según ISO 31000 y devuelve un análisis en formato JSON válido con las siguientes claves: 
    - similarityPercentage (un porcentaje estimado de similitud entre 0% y 100%),
    - patterns, 
    - similarities, 
    - differences, 
    - reliability.
    Si algún campo no aplica, usa "No disponible" como valor.
    
    Caso de estudio:
    ${req.body.caseStudy}
    
    Respuesta del usuario:
    ${req.body.userResponse}
    
    Respuesta de la IA:
    ${req.body.aiResponse}
    
    El formato de respuesta debe ser exactamente este:
    {
      "similarityPercentage": "X%",
      "patterns": "texto descriptivo o 'No disponible'",
      "similarities": "texto descriptivo o 'No disponible'",
      "differences": "texto descriptivo o 'No disponible'",
      "reliability": "texto descriptivo o 'No disponible'"
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        { 
          role: "system", 
          content: "Eres un analista experto. Devuelve ÚNICAMENTE un JSON válido con los 5 campos requeridos, incluyendo similarityPercentage como porcentaje. Usa 'No disponible' si no hay datos." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    let responseContent = completion.choices[0].message.content;
    
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
    const finalAnalysis = {
      similarityPercentage: analysis.similarityPercentage || "0%",
      patterns: analysis.patterns || "No se identificaron patrones",
      similarities: analysis.similarities || "No se encontraron similitudes",
      differences: analysis.differences || "No se encontraron diferencias",
      reliability: analysis.reliability || "No se pudo evaluar la confiabilidad"
    };

    res.json({ 
      status: 'success',
      ...finalAnalysis
    });
  } catch (error) {
    console.error('[SERVER] Error en /compare-responses:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Error al comparar las respuestas',
      details: error.message
    });
  }
});

// Ruta para la página de comparación
app.get('/compare', (req, res) => {
  res.render('compare', {
    userResponse: decodeURIComponent(req.query.userResponse),
    aiResponse: decodeURIComponent(req.query.aiResponse),
    patterns: decodeURIComponent(req.query.patterns),
    similarities: decodeURIComponent(req.query.similarities),
    differences: decodeURIComponent(req.query.differences),
    reliability: decodeURIComponent(req.query.reliability),
    similarityPercentage: decodeURIComponent(req.query.similarityPercentage || '0%')
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
});