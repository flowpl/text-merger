
function patternTokenizer(token_pattern, input) {
  const result = [];
  let startIndex = 0;
  let match;
  while (match = token_pattern.exec(input)) {
    const end_index = match.index;
    if (startIndex !== end_index) {
      result.push(input.substring(startIndex, end_index));
    }

    result.push(match[0]);
    startIndex = end_index + match[0].length;
  }

  if (startIndex !== input.length) {
    result.push(input.substring(startIndex, input.length));
  }
  return result;
}


function exampleTokenizer(input, examples) {
  const result = [];
  let startIndex = 0;
  for(const example of examples) {
    const exampleIndex = input.indexOf(example, startIndex);
    if(exampleIndex > -1) {
      if (exampleIndex !== startIndex) {
        result.push(input.substring(startIndex, exampleIndex))
      }
      result.push(example);
      startIndex = exampleIndex + example.length;
    }
  }
  if (startIndex !== input.length) {
    result.push(input.substring(startIndex, input.length));
  }
  return result;
}


function merger(patternTokenizer, exampleTokenizer, input1, input2, placeholderValues, old_placeholder_values) {
  if (input1 === input2) {
    return input1
  }

  const input1_tokens = patternTokenizer(input1);
  const new_input1_tokens = input1_tokens
    .map(function(token) { return placeholderValues[token] || token; });
  const old_input1_tokens = input1_tokens
    .map(function(token) { return old_placeholder_values[token] || token; });
  const input2_tokens = exampleTokenizer(input2, old_input1_tokens);

  let result = '';
  let i1 = 0, i2 = 0;
  for (; i1 < input1_tokens.length && i1 + i2 < input2_tokens.length; i1 += 1) {
    if (old_input1_tokens[i1] === input2_tokens[i1 + i2]) {
      result += new_input1_tokens[i1];
    } else if (input2_tokens[i1 + i2].indexOf(old_input1_tokens[i1]) > -1) {
      result += input2_tokens[i1 + i2];
    } else {
      result += input2_tokens[i1 + i2];
      i2 += 1;
      i1 -= 1;
    }
  }
  result += input2_tokens.slice(i1 + i2).join('');
  return result;
}

exports.patternTokenizer = patternTokenizer;
exports.exampleTokenizer = exampleTokenizer;
exports.textMerger = merger;
