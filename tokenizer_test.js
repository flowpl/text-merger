
const {exampleTokenizer, patternTokenizer, textMerger} = require('./tokenizer');
const {expect} = require('chai');


describe('PatternTokenizer', function() {
  const token_pattern = /\{[^}]+\}/g;

  it('should return text as a single token', function() {
    const input = 'some input string';
    const result = patternTokenizer(token_pattern, input);
    expect(result).to.deep.equal([input])
  });

  it('should find a token by regexp pattern', function() {
    const input = 'some input {placeholder}';
    const result = patternTokenizer(token_pattern, input);
    expect(result).to.deep.equal(['some input ', '{placeholder}'])
  });

  it('should find multiple_tokens by regexp pattern', function() {
    const input = 'some input {placeholder_1} some more text {placeholder_2} and the last bit.';
    const result = patternTokenizer(token_pattern, input);
    expect(result).to.deep.equal([
      'some input ',
      '{placeholder_1}',
      ' some more text ',
      '{placeholder_2}',
      ' and the last bit.',
    ]);
  });

  it('should find a pattern token at the beginning and end of the input', function() {
    const input = '{placeholder} some input {another placeholder}';
    const result = patternTokenizer(token_pattern, input);
    expect(result).to.deep.equal(['{placeholder}', ' some input ', '{another placeholder}']);
  });
});


describe('ExampleTokenizer', function() {
  it("should return a single token if the input matches the first example", function() {
    const input = 'some input';
    const examples = ['some input'];
    const result = exampleTokenizer(input, examples);
    expect(result).to.deep.equal(examples);
  });

  it('should return all examples if all examples match', function() {
    const input = 'some input another text';
    const examples = ['some input ', 'another text'];
    const result = exampleTokenizer(input, examples);
    expect(result).to.deep.equal(examples);
  });

  it('should skip examples if they cannot be found', function() {
    const input = 'some input another text';
    const examples = ['some input ', 'something missing', 'another text'];
    const result = exampleTokenizer(input, examples);
    expect(result).to.deep.equal(['some input ', 'another text']);
  });

  it('should skip missing examples at the beginning and end of the input', function() {
    const input = 'some input another text';
    const examples = ['missing', 'some input ', 'something missing', 'another text', 'missing'];
    const result = exampleTokenizer(input, examples);
    expect(result).to.deep.equal(['some input ', 'another text']);
  });

  it('should skip examples if they don\'t find a new match', function() {
    const input = 'missing some input another text';
    const examples = ['missing', ' some input ', 'something missing', 'another text', 'missing'];
    const result = exampleTokenizer(input, examples);
    expect(result).to.deep.equal(['missing', ' some input ', 'another text']);
  });

  it('should add sections from the input that lie between two examples as new tokens', function() {
    const input = 'some input something in between another text';
    const examples = ['some input', 'another text'];
    const result = exampleTokenizer(input, examples);
    expect(result).to.deep.equal(['some input', ' something in between ', 'another text']);
  });

  it('should add additional text from the end of input that does not match an example as another token', function() {
    const input = 'some input another text missing';
    const examples = ['some input ', 'another text'];
    const result = exampleTokenizer(input, examples);
    expect(result).to.deep.equal(['some input ', 'another text', ' missing']);
  });
});


describe('TextMerger', function() {
  const merger = function(input1, input2, pv, opv) {
    const token_pattern = /\{[^}]+\}/g;
    return textMerger(
      function(input) {
        return patternTokenizer(token_pattern, input);
      },
      exampleTokenizer,
      input1,
      input2,
      pv,
      opv
    );
  };

  const placeholder_values = {
    '{placeholder}': '2000',
    '{placeholder_1}': 'some replacement',
    '{placeholder_2}': 'true',
  };

  it('should return the input if input1 and input2 are identical', function() {
    const input1 = 'some text';
    const input2 = input1;

    const result = merger(input1, input2, placeholder_values, placeholder_values);
    expect(result).to.equal(input1);
  });

  it('should keep a replacement stored in input2', function() {
    const input1 = 'some text {placeholder}';
    const input2 = 'some text 2000';

    const result = merger(input1, input2, placeholder_values, placeholder_values);
    expect(result).to.equal(input2);
  });

  it('should keep multiple replacements made in input2', function() {
    const input1 = 'some text {placeholder} another text {placeholder} the end.';
    const input2 = 'some text 2000 another text 2000 the end.';

    const result = merger(input1, input2, placeholder_values, placeholder_values);
    expect(result).to.equal(input2);
  });

  it('should keep replacements at the beginning and end of input2', function() {
    const input1 = '{placeholder} some text {placeholder}';
    const input2 = '2000 some text 2000';

    const result = merger(input1, input2, placeholder_values, placeholder_values);
    expect(result).to.equal(input2);
  });

  it('should keep replacement values for different placeholders', function() {
    const input1 = '{placeholder_1} some text {placeholder_2}';
    const input2 = 'some replacement some text true';

    const result = merger(input1, input2, placeholder_values, placeholder_values);
    expect(result).to.equal(input2);
  });

  it('should keep additional values added to placeholder values', function() {
    const input1 = '{placeholder_1} some text {placeholder_2}';
    const input2 = 'some replacement 12 some text true false';

    const result = merger(input1, input2, placeholder_values, placeholder_values);
    expect(result).to.equal(input2);
  });

  it('should allow replacing placeholders with new values while keeping manual edits', function() {
    const old_placeholder_values = {
      '{placeholder_1}': 'the old replacement',
      '{placeholder_2}': 'false',
    };
    const input1 = '{placeholder_1} some text {placeholder_2}';
    const input2 = 'the old replacement 12 some text false true';

    const result = merger(input1, input2, placeholder_values, old_placeholder_values);
    expect(result).to.equal('some replacement 12 some text true true');
  });
});
