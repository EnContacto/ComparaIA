document.addEventListener('DOMContentLoaded', function() {
  console.log('[CLIENT] Documento cargado - Iniciando aplicación');
  
  // Elementos UI
  const generateCaseBtn = document.getElementById('generateCase');
  const caseStudyContainer = document.getElementById('caseStudyContainer');
  const caseStudyDialog = document.getElementById('caseStudyDialog');
  const userResponse = document.getElementById('userResponse');
  const submitResponse = document.getElementById('submitResponse');
  const aiResponse = document.getElementById('aiResponse');
  const generateAIResponseBtn = document.getElementById('generateAIResponse');
  const compareResultsBtn = document.getElementById('compareResults');
  const comparisonSection = document.getElementById('comparisonSection');
  const comparisonResults = document.getElementById('comparisonResults');
  const downloadCaseBtn = document.getElementById('downloadCase');
  const downloadAnalysisBtn = document.getElementById('downloadAnalysis');
  
  let currentCaseStudy = '';
  let currentComparison = null;
  
  // Función para animar texto como si se estuviera escribiendo
  function typeWriter(element, text, speed = 20, callback) {
      let i = 0;
      element.innerHTML = '';
      element.classList.add('typewriter-effect');
      
      function typing() {
          if (i < text.length) {
              element.innerHTML += text.charAt(i);
              i++;
              setTimeout(typing, speed);
          } else {
              element.classList.remove('typewriter-effect');
              if (callback) callback();
          }
      }
      
      typing();
  }
  
  // Función para animar aparición
  function fadeIn(element) {
      element.classList.remove('hidden');
      element.classList.add('fade-in');
  }
  
  // Generar caso de estudio
  generateCaseBtn.addEventListener('click', async function() {
      console.log('[CLIENT] Click en Generar Caso de Estudio');
      
      try {
          generateCaseBtn.disabled = true;
          generateCaseBtn.textContent = 'Generando...';
          caseStudyDialog.textContent = 'Generando caso de estudio...';
          fadeIn(caseStudyContainer);
          
          const response = await fetch('/generate-case', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  topic: 'Gestión de Riesgos en Sistemas de Información - ISO 31000'
              })
          });

          // Debug: Ver respuesta cruda
          const responseText = await response.text();
          console.log('Respuesta cruda:', responseText);
          
          if (!response.ok) {
              const errorData = JSON.parse(responseText);
              throw new Error(errorData.error || 'Error al generar el caso de estudio');
          }

          const data = JSON.parse(responseText);
          currentCaseStudy = data.caseStudy;
          
          typeWriter(caseStudyDialog, currentCaseStudy, 10, () => {
              generateCaseBtn.disabled = false;
              generateCaseBtn.textContent = 'Generar Caso de Estudio';
              comparisonSection.classList.add('hidden');
              downloadCaseBtn.classList.remove('hidden');
          });
          
      } catch (error) {
          console.error('[CLIENT] Error:', error);
          caseStudyDialog.textContent = `Error: ${error.message}`;
          caseStudyDialog.style.color = 'red';
          generateCaseBtn.disabled = false;
          generateCaseBtn.textContent = 'Generar Caso de Estudio';
      }
  });

  // Descargar caso de estudio como PDF
  downloadCaseBtn.addEventListener('click', async function() {
    if (!currentCaseStudy) {
      alert('No hay caso de estudio para descargar');
      return;
    }

    try {
      downloadCaseBtn.disabled = true;
      downloadCaseBtn.textContent = 'Generando PDF...';
      
      const response = await fetch('/generate-case-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          caseStudy: currentCaseStudy
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar PDF');
      }

      const data = await response.json();
      window.open(data.pdfUrl, '_blank');
      
    } catch (error) {
      console.error('[CLIENT] Error al generar PDF:', error);
      alert(`Error al generar PDF: ${error.message}`);
    } finally {
      downloadCaseBtn.disabled = false;
      downloadCaseBtn.textContent = 'Descargar Caso (PDF)';
    }
  });

  // Generar respuesta de IA
  generateAIResponseBtn.addEventListener('click', async function() {
      console.log('[CLIENT] Click en Generar Respuesta de IA');
      
      if (!currentCaseStudy) {
          alert('Primero genera un caso de estudio');
          return;
      }
      
      try {
          generateAIResponseBtn.disabled = true;
          generateAIResponseBtn.textContent = 'Generando...';
          aiResponse.textContent = 'Analizando caso y generando respuesta...';
          
          const response = await fetch('/generate-ai-response', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  caseStudy: currentCaseStudy
              })
          });

          const responseText = await response.text();
          console.log('Respuesta cruda:', responseText);
          
          if (!response.ok) {
              const errorData = JSON.parse(responseText);
              throw new Error(errorData.error || 'Error al generar la respuesta de IA');
          }

          const data = JSON.parse(responseText);
          
          typeWriter(aiResponse, data.aiResponse, 5, () => {
              generateAIResponseBtn.disabled = false;
              generateAIResponseBtn.textContent = 'Generar Respuesta IA';
              fadeIn(comparisonSection);
          });
          
      } catch (error) {
          console.error('[CLIENT] Error:', error);
          aiResponse.textContent = `Error: ${error.message}`;
          aiResponse.style.color = 'red';
          generateAIResponseBtn.disabled = false;
          generateAIResponseBtn.textContent = 'Generar Respuesta IA';
      }
  });

  // Comparar resultados
  compareResultsBtn.addEventListener('click', async function() {
    console.log('[CLIENT] Click en Comparar Resultados');
    
    const userText = userResponse.value.trim();
    const aiText = aiResponse.textContent.trim();
    
    if (!userText) {
        alert('Por favor, ingresa tu respuesta antes de comparar.');
        return;
    }

    if (!aiText) {
        alert('Por favor, genera una respuesta de IA antes de comparar.');
        return;
    }

    try {
        compareResultsBtn.disabled = true;
        compareResultsBtn.textContent = 'Comparando...';
        comparisonResults.textContent = 'Analizando las respuestas...';
        
        const response = await fetch('/compare-responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userResponse: userText,
                aiResponse: aiText,
                caseStudy: currentCaseStudy
            })
        });

        const responseText = await response.text();
        console.log('Respuesta cruda de comparación:', responseText);
        
        if (!response.ok) {
            const errorData = JSON.parse(responseText);
            throw new Error(errorData.error || 'Error en la comparación');
        }

        const data = JSON.parse(responseText);
        currentComparison = data;
        
        const comparisonText = `
        ★★★ Similitud: ${data.similarityPercentage} ★★★
        
        === Patrones Identificados ===
        ${data.patterns}
        
        === Similitudes Clave ===
        ${data.similarities}
        
        === Diferencias Significativas ===
        ${data.differences}
        
        === Evaluación de Confiabilidad ===
        ${data.reliability}
        `;
        
        typeWriter(comparisonResults, comparisonText, 10, () => {
          downloadAnalysisBtn.classList.remove('hidden');
        });
        
    } catch (error) {
        console.error('[CLIENT] Error al comparar respuestas:', error);
        comparisonResults.textContent = `Error: ${error.message}`;
        comparisonResults.style.color = 'red';
    } finally {
        compareResultsBtn.disabled = false;
        compareResultsBtn.textContent = 'Comparar Resultados';
    }
  });

  // Descargar análisis comparativo como PDF
  downloadAnalysisBtn.addEventListener('click', async function() {
    if (!currentComparison || !userResponse.value.trim() || !aiResponse.textContent.trim()) {
      alert('No hay análisis completo para descargar');
      return;
    }

    try {
      downloadAnalysisBtn.disabled = true;
      downloadAnalysisBtn.textContent = 'Generando PDF...';
      
      const response = await fetch('/generate-analysis-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userResponse: userResponse.value.trim(),
          aiResponse: aiResponse.textContent.trim(),
          comparison: currentComparison
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar PDF');
      }

      const data = await response.json();
      window.open(data.pdfUrl, '_blank');
      
    } catch (error) {
      console.error('[CLIENT] Error al generar PDF:', error);
      alert(`Error al generar PDF: ${error.message}`);
    } finally {
      downloadAnalysisBtn.disabled = false;
      downloadAnalysisBtn.textContent = 'Descargar Análisis (PDF)';
    }
  });

  // Enviar respuesta del usuario
  submitResponse.addEventListener('click', function() {
      if (userResponse.value.trim()) {
          alert('Respuesta guardada. Ahora puedes generar la respuesta de IA para comparar.');
      } else {
          alert('Por favor, escribe tu respuesta antes de enviar.');
      }
  });
});