// Calculadora de Expressões Numéricas
// Sistema completo de avaliação de expressões matemáticas com validação de sintaxe

class ExpressionCalculator {
  constructor() {
    this.operators = {
      '+': { precedence: 1, associativity: 'left', operation: (a, b) => a + b },
      '-': { precedence: 1, associativity: 'left', operation: (a, b) => a - b },
      '*': { precedence: 2, associativity: 'left', operation: (a, b) => a * b },
      '/': {
        precedence: 2,
        associativity: 'left',
        operation: (a, b) => {
          if (b === 0) throw new Error('ERR DIVBYZERO');
          return a / b;
        }
      },
      '^': { precedence: 3, associativity: 'right', operation: (a, b) => Math.pow(a, b) }
    };

    this.unaryOperators = {
      '+': a => +a,
      '-': a => -a
    };
  }

  // Tokenização da expressão
  tokenize(expression) {
    const tokens = [];
    const regex = /(\d*\.?\d+|\+|\-|\*|\/|\^|\(|\))/g;
    let match;
    let lastToken = null;

    while ((match = regex.exec(expression)) !== null) {
      const token = match[1];

      // Verificação de operadores unários
      if ((token === '+' || token === '-') && (lastToken === null || lastToken === '(' || this.operators[lastToken])) {
        tokens.push({ type: 'unary', value: token });
      } else if (/^\d*\.?\d+$/.test(token)) {
        tokens.push({ type: 'number', value: parseFloat(token) });
      } else if (this.operators[token]) {
        tokens.push({ type: 'operator', value: token });
      } else if (token === '(' || token === ')') {
        tokens.push({ type: 'parenthesis', value: token });
      } else {
        throw new Error('ERR SYNTAX');
      }

      lastToken = token;
    }

    return tokens;
  }

  // Validação de sintaxe da expressão
  validateSyntax(tokens) {
    if (tokens.length === 0) throw new Error('ERR SYNTAX');

    let parenthesesCount = 0;
    let lastTokenType = null;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      switch (token.type) {
        case 'number':
          if (lastTokenType === 'number') throw new Error('ERR SYNTAX');
          break;

        case 'operator':
          if (
            lastTokenType === null ||
            lastTokenType === 'operator' ||
            lastTokenType === 'unary' ||
            (lastTokenType === 'parenthesis' && tokens[i - 1].value === '(')
          ) {
            throw new Error('ERR SYNTAX');
          }
          break;

        case 'unary':
          if (lastTokenType === 'number' || (lastTokenType === 'parenthesis' && tokens[i - 1].value === ')')) {
            throw new Error('ERR SYNTAX');
          }
          break;

        case 'parenthesis':
          if (token.value === '(') {
            parenthesesCount++;
            if (lastTokenType === 'number' || (lastTokenType === 'parenthesis' && tokens[i - 1].value === ')')) {
              throw new Error('ERR SYNTAX');
            }
          } else {
            parenthesesCount--;
            if (parenthesesCount < 0) throw new Error('ERR SYNTAX');
            if (
              lastTokenType === 'operator' ||
              lastTokenType === 'unary' ||
              (lastTokenType === 'parenthesis' && tokens[i - 1].value === '(')
            ) {
              throw new Error('ERR SYNTAX');
            }
          }
          break;
      }

      lastTokenType = token.type;
    }

    if (parenthesesCount !== 0) throw new Error('ERR SYNTAX');

    // Verificar se termina com operador
    const lastToken = tokens[tokens.length - 1];
    if (lastToken.type === 'operator' || lastToken.type === 'unary') {
      throw new Error('ERR SYNTAX');
    }
  }

  // Conversão para notação polonesa reversa (Shunting Yard Algorithm)
  toRPN(tokens) {
    const output = [];
    const operatorStack = [];

    for (const token of tokens) {
      switch (token.type) {
        case 'number':
          output.push(token);
          break;

        case 'unary':
          operatorStack.push(token);
          break;

        case 'operator':
          while (operatorStack.length > 0) {
            const top = operatorStack[operatorStack.length - 1];

            if (top.type === 'parenthesis') break;

            const topPrec = top.type === 'unary' ? 4 : this.operators[top.value].precedence;
            const currentPrec = this.operators[token.value].precedence;

            if (
              topPrec > currentPrec ||
              (topPrec === currentPrec && this.operators[token.value].associativity === 'left')
            ) {
              output.push(operatorStack.pop());
            } else {
              break;
            }
          }
          operatorStack.push(token);
          break;

        case 'parenthesis':
          if (token.value === '(') {
            operatorStack.push(token);
          } else {
            while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].value !== '(') {
              output.push(operatorStack.pop());
            }
            operatorStack.pop(); // Remove '('
          }
          break;
      }
    }

    while (operatorStack.length > 0) {
      output.push(operatorStack.pop());
    }

    return output;
  }

  // Avaliação da expressão em notação RPN
  evaluateRPN(rpnTokens) {
    const stack = [];

    for (const token of rpnTokens) {
      if (token.type === 'number') {
        stack.push(token.value);
      } else if (token.type === 'unary') {
        if (stack.length < 1) throw new Error('ERR SYNTAX');
        const operand = stack.pop();
        const result = this.unaryOperators[token.value](operand);
        stack.push(result);
      } else if (token.type === 'operator') {
        if (stack.length < 2) throw new Error('ERR SYNTAX');
        const b = stack.pop();
        const a = stack.pop();
        const result = this.operators[token.value].operation(a, b);
        stack.push(result);
      }
    }

    if (stack.length !== 1) throw new Error('ERR SYNTAX');
    return stack[0];
  }

  // Método principal para calcular expressão
  calculate(expression) {
    try {
      // Remove espaços em branco
      const cleanExpression = expression.replace(/\s+/g, '');

      if (!cleanExpression) {
        throw new Error('ERR SYNTAX');
      }

      // Tokenização
      const tokens = this.tokenize(cleanExpression);

      // Validação de sintaxe
      this.validateSyntax(tokens);

      // Conversão para RPN
      const rpnTokens = this.toRPN(tokens);

      // Avaliação
      const result = this.evaluateRPN(rpnTokens);

      return {
        success: true,
        result: result,
        steps: this.generateCalculationSteps(expression, tokens, rpnTokens, result)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        steps: [`Erro encontrado: ${error.message}`]
      };
    }
  }

  // Geração de passos detalhados do cálculo
  generateCalculationSteps(original, tokens, rpnTokens, result) {
    const steps = [];

    steps.push(`Expressão original: ${original}`);

    // Mostrar tokens
    const tokenStr = tokens
      .map(t => {
        if (t.type === 'number') return t.value;
        if (t.type === 'unary') return `(${t.value})`;
        return t.value;
      })
      .join(' ');
    steps.push(`Tokens identificados: ${tokenStr}`);

    // Mostrar RPN
    const rpnStr = rpnTokens
      .map(t => {
        if (t.type === 'number') return t.value;
        if (t.type === 'unary') return `${t.value}(unário)`;
        return t.value;
      })
      .join(' ');
    steps.push(`Notação polonesa reversa: ${rpnStr}`);

    steps.push(`Avaliação concluída com sucesso`);

    return steps;
  }
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function () {
  const calculator = new ExpressionCalculator();
  const expressionInput = document.getElementById('expressionInput');
  const calculateBtn = document.getElementById('calculateBtn');
  const returnBtn = document.getElementById('returnBtn');
  const resultOutput = document.getElementById('resultOutput');

  // Evento do botão Calcular
  calculateBtn.addEventListener('click', function () {
    const inputText = expressionInput.value.trim();

    if (!inputText) {
      showResult('Por favor, digite pelo menos uma expressão.');
      return;
    }

    const expressions = inputText.split('\n').filter(line => line.trim() !== '');
    let resultHTML = '';

    expressions.forEach((expression, index) => {
      const calculation = calculator.calculate(expression);

      resultHTML += `<div class="calculation-step">`;
      resultHTML += `<div class="expression-input-text">Expressão ${index + 1}: ${expression}</div>`;

      calculation.steps.forEach(step => {
        resultHTML += `<div class="calculation-detail">${step}</div>`;
      });

      if (calculation.success) {
        // Formatação do resultado numérico
        const formattedResult = Number.isInteger(calculation.result)
          ? calculation.result.toString()
          : calculation.result.toFixed(6).replace(/\.?0+$/, '');

        resultHTML += `<div class="final-result">Resultado: ${formattedResult}</div>`;
      } else {
        resultHTML += `<div class="error-result">Erro: ${calculation.error}</div>`;
      }

      resultHTML += `</div>`;
    });

    showResult(resultHTML);
  });

  // Evento do botão Retornar
  returnBtn.addEventListener('click', function () {
    expressionInput.value = '';
    resultOutput.innerHTML =
      '<p class="result-placeholder">Digite as expressões e clique em "Calcular" para ver os resultados.</p>';
    expressionInput.focus();
  });

  // Função para exibir resultado
  function showResult(content) {
    resultOutput.innerHTML = content;
    resultOutput.scrollTop = 0;
  }

  // Suporte para Enter no textarea (Ctrl+Enter para calcular)
  expressionInput.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      calculateBtn.click();
    }
  });

  // Foco inicial no input
  expressionInput.focus();
});
