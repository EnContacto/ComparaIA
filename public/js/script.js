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
  
  let currentCaseStudy = '';
  
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
          // Mostrar estado de carga
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
          
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Error al generar el caso de estudio');
          }

          const data = await response.json();
          currentCaseStudy = data.caseStudy;
          
          // Animar la aparición del texto
          typeWriter(caseStudyDialog, currentCaseStudy, 10, () => {
              generateCaseBtn.disabled = false;
              generateCaseBtn.textContent = 'Generar Caso de Estudio';
              comparisonSection.classList.add('hidden');
          });
          
      } catch (error) {
          console.error('[CLIENT] Error:', error);
          caseStudyDialog.textContent = `Error: ${error.message}`;
          caseStudyDialog.style.color = 'red';
          generateCaseBtn.disabled = false;
          generateCaseBtn.textContent = 'Generar Caso de Estudio';
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

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Error al generar la respuesta de IA');
          }

          const data = await response.json();
          
          // Animar la respuesta de IA
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
// Comparar resultados
compareResultsBtn.addEventListener('click', async function() {
  console.log('[CLIENT] Click en Comparar Resultados');
  
  const userText = userResponse.value.trim();
  const aiText = aiResponse.textContent.trim();
  
  console.log('[CLIENT] Contenido a comparar:', {
      userTextLength: userText.length,
      aiTextLength: aiText.length
  });

  if (!userText) {
      const errorMsg = 'Por favor, ingresa tu respuesta antes de comparar.';
      console.error('[CLIENT] Error:', errorMsg);
      alert(errorMsg);
      return;
  }

  if (!aiText) {
      const errorMsg = 'Por favor, genera una respuesta de IA antes de comparar.';
      console.error('[CLIENT] Error:', errorMsg);
      alert(errorMsg);
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

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error en la comparación');
      }

      const data = await response.json();
      console.log('[CLIENT] Resultado de comparación:', data);
      
      // Construir texto formateado
      const comparisonText = `
      === Patrones Identificados ===
      ${data.patterns}
      
      === Similitudes Clave ===
      ${data.similarities}
      
      === Diferencias Significativas ===
      ${data.differences}
      
      === Evaluación de Confiabilidad ===
      ${data.reliability}
      `;
      
      // Mostrar con animación
      typeWriter(comparisonResults, comparisonText, 10);
      
  } catch (error) {
      console.error('[CLIENT] Error al comparar respuestas:', error);
      comparisonResults.textContent = `Error: ${error.message}`;
      comparisonResults.style.color = 'red';
  } finally {
      compareResultsBtn.disabled = false;
      compareResultsBtn.textContent = 'Comparar Resultados';
  }
});

  // Enviar respuesta del usuario (opcional)
  submitResponse.addEventListener('click', function() {
      if (userResponse.value.trim()) {
          alert('Respuesta guardada. Ahora puedes generar la respuesta de IA para comparar.');
      } else {
          alert('Por favor, escribe tu respuesta antes de enviar.');
      }
  });
});