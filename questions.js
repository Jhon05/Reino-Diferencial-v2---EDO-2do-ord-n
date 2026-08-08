/* Banco dinámico: SOLO ecuaciones diferenciales lineales de SEGUNDO ORDEN.
   Cada entrada puede ser una función generadora: al elegir la pregunta, cambia valores,
   opciones, pistas y retroalimentación aunque la estructura matemática sea la misma.
   Regla de calidad: las alternativas deben conservar estructura visual equivalente para
   no revelar la respuesta correcta por notación, longitud o formato. */
(() => {
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
  const L = s => `\\(${s}\\)`;
  const sgn = n => n >= 0 ? `+${n}` : `${n}`;
  const term = (n, v) => n === 0 ? '' : `${n > 0 ? '+' : '-'}${Math.abs(n) === 1 ? '' : Math.abs(n)}${v}`;
  const coef = n => Math.abs(n) === 1 ? (n < 0 ? '-' : '') : String(n);
  const clean = s => s.replace(/\+\-/g, '-').replace(/\+0y/g, '').replace(/\+0y'/g, '').replace(/\s+/g, ' ').trim();

  function shuffle(items) {
    const a = items.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function optionSemanticKey(op) {
    const raw=String(op??'').replace(/\\\(|\\\)/g,'').replace(/\s+/g,'').replace(/\\,/g,'').replace(/\{/g,'{').trim();
    // Soluciones homogéneas con dos exponenciales: el orden de C1,C2 es irrelevante.
    let m=raw.match(/^y=C_1e\^\{([^{}]+)x\}\+C_2e\^\{([^{}]+)x\}$/);
    if(m){const roots=[m[1],m[2]].sort();return `hom-exp:${roots.join('|')}`;}
    // Cauchy-Euler con dos potencias: el orden de las constantes arbitrarias también es irrelevante.
    m=raw.match(/^y=C_1x\^\{([^{}]+)\}\+C_2x\^\{([^{}]+)\}$/);
    if(m){const roots=[m[1],m[2]].sort();return `hom-euler:${roots.join('|')}`;}
    return raw.toLowerCase();
  }

  function safeFallbackDistractors(correct) {
    const s=String(correct??'');
    const pureMath=s.startsWith('\\(')&&s.endsWith('\\)');
    if(pureMath){
      const raw=s.slice(2,-2);
      if(raw.includes("u_1'")&&raw.includes("u_2'"))return [
        L(`u_1'=0,\\quad u_2'=0`),L(`u_1'=1,\\quad u_2'=1`),L(`u_1'=g,\\quad u_2'=g`),
        L(`u_1'=W,\\quad u_2'=W`),L(`u_1'=-g,\\quad u_2'=g`)
      ];
      const lhs=(raw.match(/^([^=]+)=/)||[])[1];
      if(lhs)return [L(`${lhs}=0`),L(`${lhs}=1`),L(`${lhs}=x`),L(`${lhs}=-1`),L(`${lhs}=e^x`)];
      return [L(`0`),L(`1`),L(`x`),L(`-1`),L(`e^x`)];
    }
    return [
      'No se puede determinar con la información dada.',
      'Ninguna de las anteriores.',
      'La información es insuficiente.',
      'No existe una solución de ese tipo.',
      'Se requiere una condición inicial adicional.'
    ];
  }

  function make(prompt, correct, distractors, feedback, hint, solution) {
    const unique = [], keys = new Set();
    const add = op => {
      if(op==null)return;
      const key=optionSemanticKey(op);
      if(keys.has(key))return;
      keys.add(key);unique.push(op);
    };
    add(correct);
    (distractors||[]).forEach(add);
    safeFallbackDistractors(correct).forEach(op=>{if(unique.length<6)add(op)});
    // Último seguro: siempre seis alternativas distintas sin repetir una respuesta equivalente.
    let n=1;
    while(unique.length<6)add(String(correct).includes('\\(')?L(`\\text{Distractor conceptual ${n++}}`):`Distractor conceptual ${n++}`);
    const options = shuffle(unique.slice(0,6));
    return {
      prompt,
      options,
      answer: options.findIndex(op=>optionSemanticKey(op)===optionSemanticKey(correct)),
      hint,
      feedback,
      solution
    };
  }

  function eqConstFromRoots(r1, r2) {
    const p = -(r1 + r2), q = r1 * r2;
    return clean(`y'' ${term(p, "y'")} ${term(q, 'y')} =0`);
  }
  function charPoly(p, q) { return clean(`r^2 ${term(p, 'r')} ${q >= 0 ? '+' + q : q}=0`); }
  function solDistinct(r1, r2) { return L(`y=C_1e^{${r1}x}+C_2e^{${r2}x}`); }
  function solRepeated(r) { return L(`y=(C_1+C_2x)e^{${r}x}`); }
  function solComplex(a, b) { return L(`y=e^{${a}x}(C_1\\cos(${b}x)+C_2\\sin(${b}x))`); }

  function questionWExpo() {
    let a = rand(-3, 2), b = rand(1, 5);
    if (a === b) b++;
    const diff = b - a;
    const exp = a + b;
    // Todas las alternativas tienen la misma forma visual: solo se compara el valor de W.
    const correct = L(`${diff}e^{${exp}x}`);
    return make(
      `Para ${L(`y_1=e^{${a}x}`)} y ${L(`y_2=e^{${b}x}`)}, calcula el valor de ${L(`W(y_1,y_2)`)}.`,
      correct,
      [
        L(`${-diff}e^{${exp}x}`),
        L(`${diff + 1}e^{${exp}x}`),
        L(`${diff}e^{${exp + 1}x}`),
        L(`${diff + 2}e^{${exp - 1}x}`),
        L(`${diff + 3}e^{${exp + 2}x}`)
      ],
      `Para dos funciones exponenciales diferentes, el Wronskiano no debe dar cero. Aquí ${L(`W=y_1y_2'-y_1'y_2`)} y el factor que queda es la diferencia de raíces ${L(`${b}-${a}=${diff}`)}.`,
      `Pista: deriva cada exponencial y factoriza ${L(`e^{${a}x}e^{${b}x}=e^{${exp}x}`)} antes de simplificar el coeficiente.`,
      `Cálculo: ${L(`y_1'=${a}e^{${a}x}`)} y ${L(`y_2'=${b}e^{${b}x}`)}. Entonces ${L(`W=e^{${a}x}(${b}e^{${b}x})-(${a}e^{${a}x})e^{${b}x}=(${b}-${a})e^{${exp}x}=${diff}e^{${exp}x}`)}.`
    );
  }

  function questionRepeatedW() {
    const r = rand(-2, 3);
    const exponent = 2*r;
    return make(
      `En una EDO lineal homogénea de segundo orden con raíz repetida ${L(`r=${r}`)}, calcula el valor de ${L(`W(y_1,y_2)`)} para ${L(`y_1=e^{${r}x}`)} y ${L(`y_2=xe^{${r}x}`)}.`,
      L(`e^{${exponent}x}`),
      [
        L(`-e^{${exponent}x}`),
        L(`xe^{${exponent}x}`),
        L(`2e^{${exponent}x}`),
        L(`e^{${exponent + 1}x}`),
        L(`x e^{${exponent + 1}x}`)
      ],
      `El par ${L(`e^{rx},xe^{rx}`)} es fundamental para una raíz repetida. Su Wronskiano es no nulo y vale ${L(`e^{2rx}`)}.`,
      `Pista: deriva ${L(`xe^{rx}`)} con regla del producto: ${L(`(xe^{rx})'=e^{rx}+rxe^{rx}`)}.`,
      `Al reemplazar: ${L(`W=e^{rx}(e^{rx}+rxe^{rx})-(re^{rx})(xe^{rx})=e^{2rx}`)}. Para ${L(`r=${r}`)}, queda ${L(`e^{${exponent}x}`)}.`
    );
  }

  function questionAbel() {
    const p = rand(-4, 4) || 2;
    return make(
      `Para la ecuación lineal homogénea de segundo orden ${L(`y''${term(p,"y'")}+q(x)y=0`)}, ¿qué expresión corresponde a ${L(`W(x)`)} según la identidad de Abel?`,
      L(`W(x)=C e^{-${p}x}`),
      [
        L(`W(x)=C e^{${p}x}`),
        L(`W(x)=C e^{-${p}x^2/2}`),
        L(`W(x)=C+${p}x`),
        L(`W(x)=C e^{-${2*p}x}`),
        L(`W(x)=C e^{-${p}x}+1`)
      ],
      `En forma estándar ${L(`y''+P(x)y'+Q(x)y=0`)}, Abel dice ${L(`W'= -P(x)W`)}. Si ${L(`P(x)=${p}`)}, entonces ${L(`W=Ce^{-\\int ${p}\\,dx}=Ce^{-${p}x}`)}.`,
      `Pista: las cuatro opciones tienen la misma estructura de Wronskiano. Decide el exponente integrando ${L(`-P(x)`)}.`,
      `Como ${L(`P(x)=${p}`)}, se integra ${L(`-P(x)`)}: ${L(`\\int -${p}\\,dx=-${p}x`)}. Por eso ${L(`W(x)=Ce^{-${p}x}`)}.`
    );
  }

  function questionFundamental() {
    return make(
      `Para una EDO lineal homogénea de segundo orden, ¿qué condición garantiza que ${L(`y_1,y_2`)} formen un conjunto fundamental en un intervalo?`,
      `Que ${L(`W(y_1,y_2)(x_0)\\neq 0`)} para algún ${L(`x_0`)} del intervalo.`,
      [
        `Que ${L(`W(y_1,y_2)(x)=0`)} para todo ${L(`x`)} del intervalo.`,
        `Que ${L(`y_1(x_0)=y_2(x_0)`)} para algún ${L(`x_0`)} del intervalo.`,
        `Que ${L(`y_1'(x_0)=y_2'(x_0)`)} para algún ${L(`x_0`)} del intervalo.`,
        `Que ${L(`y_1+y_2=0`)} en algún punto del intervalo.`,
        `Que ${L(`y_1'(x_0)y_2'(x_0)=0`)} para algún ${L(`x_0`)} del intervalo.`
      ],
      `En segundo orden se necesitan dos soluciones linealmente independientes. Un Wronskiano no nulo en un punto garantiza esa independencia.`,
      `Pista: busca la condición que impide que una solución sea múltiplo de la otra.`,
      `Si ${L(`W(y_1,y_2)(x_0)\\neq 0`)}, entonces ${L(`y_1,y_2`)} son linealmente independientes y ${L(`y=C_1y_1+C_2y_2`)} describe todas las soluciones homogéneas.`
    );
  }

  function questionCharDistinct() {
    let r1 = rand(-4, 1), r2 = rand(2, 5);
    if (r1 === r2) r2++;
    const eq = eqConstFromRoots(r1, r2);
    return make(
      `Resuelve la ecuación homogénea de segundo orden con coeficientes constantes ${L(eq)}.`,
      solDistinct(r1, r2),
      [L(`y=C_1e^{${r1-1}x}+C_2e^{${r2}x}`), solRepeated(r1), L(`y=C_1\\cos(${Math.abs(r1)}x)+C_2\\sin(${Math.abs(r2)}x)`), L(`y=C_1e^{${r1}x}+C_2xe^{${r2}x}`), L(`y=C_1xe^{${r1}x}+C_2e^{${r2}x}`)],
      `La ecuación característica factoriza como ${L(`(r-${r1})(r-${r2})=0`)}, así que las raíces reales distintas producen dos exponenciales independientes.`,
      `Pista: reemplaza ${L(`y'',y' ,y`)} por ${L(`r^2,r,1`)} y factoriza el polinomio característico.`,
      `El polinomio característico es ${L(charPoly(-(r1+r2), r1*r2))}. Sus raíces son ${L(`r_1=${r1}`)} y ${L(`r_2=${r2}`)}. Por eso ${solDistinct(r1, r2)}.`
    );
  }

  function questionCharRepeated() {
    const r = rand(-3, 4) || 2;
    const eq = eqConstFromRoots(r, r);
    return make(
      `La ecuación ${L(eq)} tiene raíz repetida en la característica. ¿Cuál es la solución general?`,
      solRepeated(r),
      [L(`y=C_1e^{${r}x}+C_2e^{${-r}x}`), L(`y=C_1e^{${r}x}+C_2xe^{${-r}x}`), L(`y=e^{${r}x}(C_1\\cos x+C_2\\sin x)`), L(`y=(C_1+C_2x^2)e^{${r}x}`), L(`y=C_1e^{${r+1}x}+C_2e^{${r-1}x}`)],
      `Cuando la raíz ${L(`r=${r}`)} tiene multiplicidad dos, la segunda solución se obtiene multiplicando por ${L(`x`)}.`,
      `Pista: raíz repetida no produce dos exponenciales diferentes; se usa ${L(`e^{rx}`)} y ${L(`xe^{rx}`)}.`,
      `La característica es ${L(`(r-${r})^2=0`)}. Entonces el conjunto fundamental es ${L(`e^{${r}x},xe^{${r}x}`)} y ${solRepeated(r)}.`
    );
  }

  function questionCharComplex() {
    const a = rand(-2, 2), b = rand(1, 5);
    const p = -2 * a, q = a * a + b * b;
    const eq = clean(`y'' ${term(p,"y'")} ${term(q,'y')}=0`);
    return make(
      `La ecuación ${L(eq)} tiene raíces complejas. Selecciona la solución real general.`,
      solComplex(a, b),
      [L(`y=C_1e^{${a+b}x}+C_2e^{${a-b}x}`), L(`y=e^{${a+2}x}(C_1\\cos(${b}x)+C_2\\sin(${b}x))`), L(`y=(C_1+C_2x)e^{${a}x}`), L(`y=e^{${a}x}(C_1\\cos(${b+1}x)+C_2\\sin(${b+1}x))`), L(`y=e^{${a-1}x}(C_1\\cos(${b}x)+C_2\\sin(${b}x))`)],
      `Si las raíces son ${L(`a\\pm bi`)}, la solución real es ${L(`e^{ax}(C_1\\cos bx+C_2\\sin bx)`)}.`,
      `Pista: identifica la parte real y la parte imaginaria de las raíces, no cambies sus papeles.`,
      `Aquí la característica tiene raíces ${L(`${a}\\pm ${b}i`)}. Por tanto la parte real ${L(`${a}`)} va en el exponencial y la parte imaginaria ${L(`${b}`)} en seno y coseno.`
    );
  }

  function questionCharacteristicEquation() {
    const p = pick([-5,-4,-3,-2,2,3,4,5]);
    const q = pick([-6,-4,-3,2,5,6,8]);
    return make(
      `Para la EDO de segundo orden ${L(clean(`y'' ${term(p,"y'")} ${term(q,'y')}=0`))}, ¿cuál es la ecuación característica?`,
      L(charPoly(p, q)),
      [L(charPoly(-p, q)), L(charPoly(p, -q)), L(clean(`r ${term(p,'')} ${q >= 0 ? '+' + q : q}=0`)), L(clean(`r^2 ${term(q,'r')} ${p >= 0 ? '+' + p : p}=0`)), L(clean(`r^2 ${term(p+1,'r')} ${q >= 0 ? '+' + q : q}=0`))],
      `En ecuaciones con coeficientes constantes se reemplaza ${L(`y''`)} por ${L(`r^2`)}, ${L(`y'`)} por ${L(`r`)} y ${L(`y`)} por ${L(`1`)}.`,
      `Pista: conserva exactamente los signos que acompañan a ${L(`y'`)} y a ${L(`y`)}.`,
      `La regla directa da ${L(`y''\\mapsto r^2`)}, ${L(`y'\\mapsto r`)} y ${L(`y\\mapsto 1`)}. Así se obtiene ${L(charPoly(p, q))}.`
    );
  }

  function questionEulerDistinct() {
    let m1 = rand(-2, 2), m2 = rand(3, 5);
    if (m1 === 0) m1 = 1;
    const A = 1 - (m1 + m2), B = m1 * m2;
    const eq = clean(`x^2y'' ${term(A,'xy\'')} ${term(B,'y')}=0`);
    return make(
      `Resuelve para ${L(`x>0`)} la ecuación de Cauchy-Euler de segundo orden ${L(eq)}.`,
      L(`y=C_1x^{${m1}}+C_2x^{${m2}}`),
      [L(`y=C_1e^{${m1}x}+C_2e^{${m2}x}`), L(`y=(C_1+C_2\\ln x)x^{${m1}}`), L(`y=x^{${m1}}(C_1\\cos(${m2}\\ln x)+C_2\\sin(${m2}\\ln x))`), L(`y=C_1x^{${m1}}+C_2x^{${m2+1}}`), L(`y=C_1x^{${m1-1}}+C_2x^{${m2}}`)],
      `En Cauchy-Euler se ensaya ${L(`y=x^m`)}. Si las raíces indiciales son reales distintas, aparecen potencias ${L(`x^{m_1}`)} y ${L(`x^{m_2}`)}.`,
      `Pista: sustituye ${L(`y=x^m`)}, ${L(`xy'=mx^m`)} y ${L(`x^2y''=m(m-1)x^m`)}.`,
      `La ecuación indicial es ${L(`m(m-1)+${A}m+${B}=0`)}, que factoriza como ${L(`(m-${m1})(m-${m2})=0`)}. Por eso la solución es ${L(`C_1x^{${m1}}+C_2x^{${m2}}`)}.`
    );
  }

  function questionEulerRepeated() {
    const m = rand(-1, 4) || 2;
    const A = 1 - 2*m, B = m*m;
    const eq = clean(`x^2y'' ${term(A,"xy'")} ${term(B,'y')}=0`);
    return make(
      `La ecuación de Cauchy-Euler ${L(eq)} tiene raíz indicial repetida. ¿Cuál es la forma correcta de la solución?`,
      L(`y=x^{${m}}(C_1+C_2\\ln x)`),
      [L(`y=(C_1+C_2x)e^{${m}x}`), L(`y=C_1x^{${m}}+C_2x^{-${m}}`), L(`y=x^{${m}}(C_1\\cos x+C_2\\sin x)`), L(`y=x^{${m}}(C_1+C_2x)`), L(`y=x^{${m+1}}(C_1+C_2\\ln x)`)],
      `En Cauchy-Euler, una raíz repetida no genera ${L(`xe^{rx}`)}, sino el factor logarítmico ${L(`x^m\\ln x`)}.`,
      `Pista: en coeficientes constantes la repetición produce ${L(`xe^{rx}`)}, pero en Cauchy-Euler produce ${L(`x^m\\ln x`)}.`,
      `La indicial es ${L(`(m-${m})^2=0`)}. El conjunto fundamental es ${L(`x^{${m}}, x^{${m}}\\ln x`)}.`
    );
  }

  function questionEulerComplex() {
    const a = rand(-1, 3), b = rand(1, 4);
    return make(
      `Si la ecuación indicial de una Cauchy-Euler de segundo orden tiene raíces ${L(`${a}\\pm ${b}i`)}, ¿cuál es la forma real de la solución?`,
      L(`y=x^{${a}}(C_1\\cos(${b}\\ln x)+C_2\\sin(${b}\\ln x))`),
      [L(`y=e^{${a}x}(C_1\\cos(${b}x)+C_2\\sin(${b}x))`), L(`y=C_1x^{${a+b}}+C_2x^{${a-b}}`), L(`y=x^{${a}}(C_1+C_2\\ln x)`), L(`y=x^{${a+1}}(C_1\\cos(${b}\\ln x)+C_2\\sin(${b}\\ln x))`), L(`y=x^{${a}}(C_1\\cos(${b}x)+C_2\\sin(${b}x))`)],
      `En Cauchy-Euler, las raíces complejas producen oscilación en ${L(`\\ln x`)}, no en ${L(`x`)}.`,
      `Pista: cambia la variable mentalmente a ${L(`t=\\ln x`)}; por eso aparece seno y coseno de ${L(`b\\ln x`)}.`,
      `Con raíces ${L(`a\\pm bi`)}, la solución es ${L(`x^a(C_1\\cos(b\\ln x)+C_2\\sin(b\\ln x))`)}. Aquí ${L(`a=${a}`)} y ${L(`b=${b}`)}.`
    );
  }

  function questionUndeterminedExp() {
    const r = pick([-2,-1,1,2,3]);
    const m = pick([-3,-1,0,2,4].filter(x => x !== r));
    const s = pick([1,2,3]);
    const q = r * s;
    const p = -(r + s);
    const A = rand(2, 6);
    const denom = m*m + p*m + q;
    if (denom === 0) return questionUndeterminedExp();
    const correct = L(`y_p=\\frac{${A}}{${denom}}e^{${m}x}`);
    return make(
      `Para ${L(clean(`y'' ${term(p,"y'")} ${term(q,'y')}=${A}e^{${m}x}`))}, usando coeficientes indeterminados, ¿qué particular corresponde si ${L(`${m}`)} no es raíz de la característica?`,
      correct,
      [L(`y_p=${A}e^{${m}x}`), L(`y_p=Ax e^{${m}x}`), L(`y_p=\\frac{${A}}{${m+p+q}}e^{${m}x}`), L(`y_p=\\frac{${A}}{${denom+1}}e^{${m}x}`), L(`y_p=\\frac{${A}}{${denom}}xe^{${m}x}`)],
      `Se propone ${L(`y_p=Ke^{${m}x}`)}. Al sustituir, queda ${L(`K(m^2+pm+q)e^{mx}=${A}e^{mx}`)}, de donde ${L(`K=${A}/${denom}`)}.`,
      `Pista: no basta copiar el lado derecho. Debes aplicar el operador característico evaluado en ${L(`m`)}.`,
      `El operador da ${L(`m^2+pm+q=${m}^2+(${p})${m}+${q}=${denom}`)}. Entonces ${L(`K=${A}/${denom}`)}.`
    );
  }

  function questionUndeterminedResonance() {
    const m = rand(-2, 3) || 1;
    return make(
      `En una EDO lineal de segundo orden con coeficientes constantes, el lado derecho es ${L(`e^{${m}x}`)} y ${L(`r=${m}`)} es raíz simple de la característica homogénea. ¿Cuál ensayo debe usarse?`,
      L(`y_p=Axe^{${m}x}`),
      [L(`y_p=Ae^{${m}x}`), L(`y_p=Ax^2e^{${m}x}`), L(`y_p=A\\cos(${m}x)+B\\sin(${m}x)`), L(`y_p=(A+Bx)e^{${m}x}`), L(`y_p=Axe^{${m+1}x}`)],
      `Hay resonancia porque ${L(`e^{${m}x}`)} ya aparece en la solución homogénea. Como la raíz es simple, se multiplica una vez por ${L(`x`)}.`,
      `Pista: si el ensayo se repite con la homogénea, multiplícalo por ${L(`x`)} hasta que sea independiente.`,
      `Sin resonancia sería ${L(`Ae^{${m}x}`)}, pero como ${L(`r=${m}`)} es raíz simple, el ensayo correcto es ${L(`Axe^{${m}x}`)}.`
    );
  }

  function questionUndeterminedTrig() {
    const w = rand(2, 5);
    return make(
      `Para una ecuación lineal de segundo orden con coeficientes constantes y término no homogéneo ${L(`7\\cos(${w}x)`)}, sin resonancia, ¿qué forma debe tener el ensayo?`,
      L(`y_p=A\\cos(${w}x)+B\\sin(${w}x)`),
      [L(`y_p=A\\cos(${w}x)`), L(`y_p=Ae^{${w}x}`), L(`y_p=Ax\\cos(${w}x)`), L(`y_p=A\\sin(${w}x)`), L(`y_p=A\\cos(${w+1}x)+B\\sin(${w+1}x)`)],
      `Al derivar cosenos aparecen senos, por eso el ensayo debe incluir simultáneamente seno y coseno con la misma frecuencia.`,
      `Pista: el método de coeficientes indeterminados debe ser cerrado bajo derivación.`,
      `Como ${L(`(\\cos wx)'=-w\\sin wx`)} y ${L(`(\\sin wx)'=w\\cos wx`)}, se toma ${L(`A\\cos(wx)+B\\sin(wx)`)}.`
    );
  }

  function questionReductionFormula() {
    return make(
      `Para ${L(`y''+P(x)y'+Q(x)y=0`)}, si ya se conoce una solución no nula ${L(`y_1`)}, ¿cuál es la fórmula de reducción de orden para una segunda solución?`,
      L(`y_2=y_1\\int \\frac{e^{-\\int P(x)dx}}{y_1^2}\\,dx`),
      [L(`y_2=\\int y_1 e^{\\int P(x)dx}dx`), L(`y_2=y_1\\int Q(x)y_1^2dx`), L(`y_2=e^{\\int P(x)dx}/y_1`), L(`y_2=y_1\\int e^{\\int P(x)dx}y_1^2\\,dx`), L(`y_2=y_1\\int \\frac{e^{\\int P(x)dx}}{y_1}\\,dx`)],
      `La fórmula viene de buscar ${L(`y_2=v(x)y_1`)} y reducir la ecuación a una de primer orden para ${L(`v'`)}.`,
      `Pista: recuerda que aparece ${L(`e^{-\\int P}`)} en el numerador y ${L(`y_1^2`)} en el denominador.`,
      `Al sustituir ${L(`y_2=vy_1`)}, se obtiene ${L(`v'=e^{-\\int P}/y_1^2`)}, y por eso ${L(`y_2=y_1\\int e^{-\\int P}/y_1^2 dx`)}.`
    );
  }

  function questionReductionRepeated() {
    const r = rand(-2, 3) || 1;
    return make(
      `En ${L(clean(`y'' ${term(-2*r,"y'")} ${term(r*r,'y')}=0`))}, se conoce ${L(`y_1=e^{${r}x}`)}. Por reducción de orden, ¿cuál puede ser ${L(`y_2`)}?`,
      L(`y_2=xe^{${r}x}`),
      [L(`y_2=e^{-${r}x}`), L(`y_2=x^2e^{${r}x}`), L(`y_2=\\ln(x)e^{${r}x}`), L(`y_2=xe^{-${r}x}`), L(`y_2=e^{${r+1}x}`)],
      `La ecuación tiene raíz repetida ${L(`r=${r}`)}. La reducción de orden produce la segunda solución ${L(`xe^{rx}`)}.`,
      `Pista: cuando la característica tiene raíz doble, la segunda solución se obtiene multiplicando por ${L(`x`)}.`,
      `Como ${L(`(r-${r})^2=0`)}, un conjunto fundamental es ${L(`e^{${r}x},xe^{${r}x}`)}.`
    );
  }

  function questionReductionEuler() {
    return make(
      `Para la Cauchy-Euler ${L(`x^2y''-2xy'+2y=0`)}, se conoce ${L(`y_1=x`)}. ¿Cuál es una segunda solución por reducción de orden?`,
      L(`y_2=x^2`),
      [L(`y_2=e^x`), L(`y_2=x\\ln x`), L(`y_2=1/x`), L(`y_2=x^3`), L(`y_2=\\ln x`)],
      `La ecuación indicial es ${L(`m^2-3m+2=0`)}, con raíces ${L(`1`)} y ${L(`2`)}. Si ya conoces ${L(`x`)}, falta ${L(`x^2`)}.`,
      `Pista: en Cauchy-Euler prueba soluciones de la forma ${L(`x^m`)}.`,
      `Sustituir ${L(`y=x^m`)} da ${L(`m(m-1)-2m+2=m^2-3m+2=(m-1)(m-2)`)}. Por eso ${L(`y_2=x^2`)}.`
    );
  }

  function questionVariationFormula() {
    return make(
      `Para ${L(`y''+P(x)y'+Q(x)y=g(x)`)}, con soluciones homogéneas ${L(`y_1,y_2`)} y Wronskiano ${L(`W`)}, ¿cuáles son las fórmulas correctas de variación de parámetros?`,
      L(`u_1'=-\\frac{y_2g}{W},\\quad u_2'=\\frac{y_1g}{W}`),
      [L(`u_1'=\\frac{y_1g}{W},\\quad u_2'=\\frac{y_2g}{W}`), L(`u_1'=y_2gW,\\quad u_2'=-y_1gW`), L(`u_1'=\\frac{g}{y_1},\\quad u_2'=\\frac{g}{y_2}`), L(`u_1'=\\frac{y_2g}{W},\\quad u_2'=-\\frac{y_1g}{W}`), L(`u_1'=-\\frac{y_1g}{W},\\quad u_2'=\\frac{y_2g}{W}`)],
      `En forma estándar de segundo orden, la particular se escribe ${L(`y_p=u_1y_1+u_2y_2`)} y se resuelve un sistema para ${L(`u_1',u_2'`)}.`,
      `Pista: recuerda el signo negativo en ${L(`u_1'`)} y que el Wronskiano va en el denominador.`,
      `El sistema auxiliar es ${L(`u_1'y_1+u_2'y_2=0`)}, ${L(`u_1'y_1'+u_2'y_2'=g`)}. Al resolverlo se obtiene ${L(`u_1'=-y_2g/W`)}, ${L(`u_2'=y_1g/W`)}.`
    );
  }

  function questionVariationCompute() {
    const k = rand(1, 4);
    return make(
      `En ${L(`y''-y=${k}e^x`)}, toma ${L(`y_1=e^x`)}, ${L(`y_2=e^{-x}`)}. Como ${L(`W=-2`)}, ¿cuáles son ${L(`u_1'`)} y ${L(`u_2'`)}?`,
      L(`u_1'=\\frac{${k}}{2},\\quad u_2'=-\\frac{${k}}{2}e^{2x}`),
      [L(`u_1'=-\\frac{${k}}{2},\\quad u_2'=\\frac{${k}}{2}e^{2x}`), L(`u_1'=${k}e^x,\\quad u_2'=${k}e^{-x}`), L(`u_1'=\\frac{${k}}{2}e^{2x},\\quad u_2'=-\\frac{${k}}{2}`), L(`u_1'=\\frac{${k}}{2},\\quad u_2'=\\frac{${k}}{2}e^{2x}`), L(`u_1'=-\\frac{${k}}{2},\\quad u_2'=-\\frac{${k}}{2}e^{2x}`)],
      `Usa ${L(`u_1'=-y_2g/W`)} y ${L(`u_2'=y_1g/W`)}. El signo de ${L(`W=-2`)} es decisivo.`,
      `Pista: multiplica ${L(`y_2=e^{-x}`)} por ${L(`g=${k}e^x`)} para ${L(`u_1'`)}.`,
      `Se tiene ${L(`u_1'=-(e^{-x})(${k}e^x)/(-2)=${k}/2`)} y ${L(`u_2'=(e^x)(${k}e^x)/(-2)=-${k}e^{2x}/2`)}.`
    );
  }

  function questionMassClassify() {
    const m = pick([1,2,3]);
    const k = pick([4,8,12,18]);
    const ccrit = Math.round(2 * Math.sqrt(m * k));
    const c = pick([Math.max(1, ccrit-2), ccrit, ccrit+3]);
    const disc = c*c - 4*m*k;
    const ans = disc < 0 ? 'subamortiguado' : disc === 0 ? 'críticamente amortiguado' : 'sobreamortiguado';
    return make(
      `El sistema masa-resorte ${L(`${m}x''+${c}x'+${k}x=0`)} es:`,
      ans,
      ['subamortiguado', 'críticamente amortiguado', 'sobreamortiguado', 'no amortiguado', 'movimiento forzado', 'sistema inestable'].filter(x => x !== ans),
      `Se compara ${L(`c^2`)} con ${L(`4mk`)}. Aquí ${L(`c^2-4mk=${disc}`)}. Eso determina el tipo de raíces de la ecuación característica.`,
      `Pista: no clasifiques mirando solo ${L(`c`)}. Calcula el discriminante físico ${L(`c^2-4mk`)}.`,
      `Si ${L(`c^2-4mk<0`)} hay oscilación amortiguada; si es cero hay amortiguamiento crítico; si es positivo hay sobreamortiguamiento. Aquí el signo corresponde a: ${ans}.`
    );
  }

  function questionMassOmega() {
    const m = pick([1,2,4]);
    const omega = rand(2, 5);
    const k = m * omega * omega;
    return make(
      `Para el sistema no amortiguado ${L(`${m}x''+${k}x=0`)}, ¿cuál es la frecuencia natural ${L(`\\omega_0`)}?`,
      L(`\\omega_0=${omega}`),
      [L(`\\omega_0=${k}`), L(`\\omega_0=${m/k}`), L(`\\omega_0=${omega*omega}`), L(`\\omega_0=${m}`), L(`\\omega_0=${k/m}`)],
      `En un sistema masa-resorte sin amortiguamiento, ${L(`\\omega_0=\\sqrt{k/m}`)}.`,
      `Pista: la frecuencia no es ${L(`k/m`)} sino la raíz cuadrada de esa razón.`,
      `Aquí ${L(`k/m=${k}/${m}=${omega*omega}`)}, luego ${L(`\\omega_0=\\sqrt{${omega*omega}}=${omega}`)}.`
    );
  }

  function questionMassCriticalSol() {
    const gamma = rand(1, 4);
    return make(
      `Si un sistema masa-resorte amortiguado tiene raíz característica repetida ${L(`r=-${gamma}`)}, ¿cuál es la forma de la solución?`,
      L(`x(t)=(C_1+C_2t)e^{-${gamma}t}`),
      [L(`x(t)=C_1e^{-${gamma}t}+C_2e^{${gamma}t}`), L(`x(t)=e^{-${gamma}t}(C_1\\cos t+C_2\\sin t)`), L(`x(t)=C_1\\cos(${gamma}t)+C_2\\sin(${gamma}t)`), L(`x(t)=(C_1+C_2t^2)e^{-${gamma}t}`), L(`x(t)=(C_1+C_2t)e^{${gamma}t}`)],
      `Una raíz repetida en una ecuación lineal de segundo orden produce el factor ${L(`t`)} multiplicando la segunda solución.`,
      `Pista: es el mismo patrón de raíz repetida de coeficientes constantes: ${L(`e^{rt}`)} y ${L(`te^{rt}`)}.`,
      `Con raíz doble ${L(`r=-${gamma}`)}, la solución es ${L(`C_1e^{-${gamma}t}+C_2te^{-${gamma}t}`)}, equivalente a ${L(`(C_1+C_2t)e^{-${gamma}t}`)}.`
    );
  }

  const T = window.DIF_THEMES = [
    { id: 'wronskiano2', castleName: 'Bastión del Wronskiano 2', label: 'Segundo orden: independencia lineal, Wronskiano y conjunto fundamental', topics: ['independencia lineal', 'Wronskiano', 'conjunto fundamental'] },
    { id: 'constantes2', castleName: 'Fortaleza Característica 2', label: 'Segundo orden con coeficientes constantes y raíces características', topics: ['característica', 'raíces reales', 'raíces complejas'] },
    { id: 'cauchy2', castleName: 'Alcázar Cauchy-Euler 2', label: 'Cauchy-Euler de segundo orden: raíces indiciales', topics: ['potencias x^m', 'raíz repetida', 'raíces complejas'] },
    { id: 'coef2', castleName: 'Torre de Coeficientes 2', label: 'Segundo orden: solución particular por coeficientes indeterminados', topics: ['ensayo', 'resonancia', 'exponenciales y trigonométricas'] },
    { id: 'reduccion2', castleName: 'Ciudadela de Reducción 2', label: 'Segundo orden con coeficientes variables: reducción de orden', topics: ['segunda solución', 'fórmula integral', 'solución conocida'] },
    { id: 'parametros2', castleName: 'Castillo de Parámetros 2', label: 'Segundo orden: solución particular por variación de parámetros', topics: ['Wronskiano', 'u1 y u2', 'no homogénea'] },
    { id: 'masa2', castleName: 'Arsenal Masa-Resorte 2', label: 'Segundo orden aplicado: sistemas masa-resorte', topics: ['amortiguamiento', 'frecuencia natural', 'raíces características'] }
  ];

  window.DIF_QUESTIONS = {
    wronskiano2: {
      easy: [questionFundamental, questionWExpo, questionRepeatedW, questionAbel],
      hard: [questionWExpo, questionRepeatedW, questionAbel, questionFundamental]
    },
    constantes2: {
      easy: [questionCharacteristicEquation, questionCharDistinct, questionCharRepeated, questionCharComplex],
      hard: [questionCharDistinct, questionCharRepeated, questionCharComplex, questionCharacteristicEquation]
    },
    cauchy2: {
      easy: [questionEulerDistinct, questionEulerRepeated, questionEulerComplex],
      hard: [questionEulerDistinct, questionEulerRepeated, questionEulerComplex]
    },
    coef2: {
      easy: [questionUndeterminedExp, questionUndeterminedResonance, questionUndeterminedTrig],
      hard: [questionUndeterminedExp, questionUndeterminedResonance, questionUndeterminedTrig]
    },
    reduccion2: {
      easy: [questionReductionFormula, questionReductionRepeated, questionReductionEuler],
      hard: [questionReductionFormula, questionReductionRepeated, questionReductionEuler]
    },
    parametros2: {
      easy: [questionVariationFormula, questionVariationCompute],
      hard: [questionVariationFormula, questionVariationCompute]
    },
    masa2: {
      easy: [questionMassClassify, questionMassOmega, questionMassCriticalSol],
      hard: [questionMassClassify, questionMassOmega, questionMassCriticalSol]
    }
  };
})();
