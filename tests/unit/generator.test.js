import { QRCodeGenerator } from '../../src/generator.js';
import { TEST_DATA, ERROR_CORRECTION_LEVELS } from '../helpers/test-data.js';
import { SVGOptionsBuilder, TestDataGenerator } from '../helpers/test-builders.js';
import { SVGStructureAssertions, SVGStyleAssertions, ConsistencyAssertions } from '../helpers/svg-assertions.js';
import { InstanceSetup, SVGValidationAssertions } from '../helpers/test-setup.js';

describe('QRCodeGenerator', () => {
  let generator;
  
  beforeEach(() => {
    generator = InstanceSetup.createGeneratorWithMocks();
  });

  describe('SVG structure validation', () => {
    test('should generate structurally valid SVG', () => {
      const svg = generator.generate(TEST_DATA.ALPHANUMERIC.MEDIUM);
      
      SVGStructureAssertions.isValid(svg);
      SVGStructureAssertions.hasContent(svg);
    });

    test('should respect dimension options', () => {
      const options = SVGOptionsBuilder.large().build();
      const svg = generator.generate(TEST_DATA.ALPHANUMERIC.SHORT, options);
      
      SVGStructureAssertions.hasDimensions(svg, options.size, options.size);
    });
  });

  describe('styling and appearance', () => {
    test('should apply custom colors', () => {
      const options = SVGOptionsBuilder
        .custom(200, 4, { dark: '#ff0000', light: '#00ff00' })
        .build();
      const svg = generator.generate(TEST_DATA.ALPHANUMERIC.SHORT, options);
      
      SVGStyleAssertions.hasColors(svg, '#ff0000', '#00ff00');
    });

    test.each([
      { size: 100, margin: 0 },
      { size: 300, margin: 10 },
      { size: 500, margin: 20 }
    ])('should handle size $size with margin $margin', (options) => {
      const svg = generator.generate(TEST_DATA.ALPHANUMERIC.SHORT, options);
      SVGValidationAssertions.isValid(svg);
    });
  });

  describe('data type compatibility', () => {
    const dataTypes = [
      { type: 'numeric', data: TEST_DATA.NUMERIC.MEDIUM },
      { type: 'alphanumeric', data: TEST_DATA.ALPHANUMERIC.MEDIUM },
      { type: 'byte', data: TEST_DATA.BYTE.MEDIUM }
    ];

    test.each(dataTypes)('should generate SVG for $type data', ({ data }) => {
      const svg = generator.generate(data);
      SVGValidationAssertions.isValid(svg);
    });
  });

  describe('error correction compatibility', () => {
    test.each(ERROR_CORRECTION_LEVELS)('should support error correction level %s', (level) => {
      const options = SVGOptionsBuilder.highError().withErrorCorrection(level).build();
      const svg = generator.generate(TEST_DATA.ALPHANUMERIC.SHORT, options);
      
      SVGValidationAssertions.isValid(svg);
    });
  });

  describe('output consistency', () => {
    test('should produce deterministic output', () => {
      const svg1 = generator.generate(TEST_DATA.ALPHANUMERIC.SHORT);
      const svg2 = generator.generate(TEST_DATA.ALPHANUMERIC.SHORT);
      
      ConsistencyAssertions.areEqual(svg1, svg2);
    });

    test('should produce different output for different inputs', () => {
      const svg1 = generator.generate(TEST_DATA.ALPHANUMERIC.SHORT);
      const svg2 = generator.generate(TEST_DATA.ALPHANUMERIC.MEDIUM);
      
      ConsistencyAssertions.areDifferent(svg1, svg2);
    });

    test('should vary output with different options', () => {
      const options1 = SVGOptionsBuilder.small().build();
      const options2 = SVGOptionsBuilder.large().build();
      
      const svg1 = generator.generate(TEST_DATA.ALPHANUMERIC.SHORT, options1);
      const svg2 = generator.generate(TEST_DATA.ALPHANUMERIC.SHORT, options2);
      
      ConsistencyAssertions.areDifferent(svg1, svg2);
    });
  });
});