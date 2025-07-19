// ISP原則に従い、専門特化したアサーションクラスに分割
export class SVGStructureAssertions {
  static isValid(svg) {
    expect(svg).toMatch(/^<svg[^>]*>/);
    expect(svg).toMatch(/<\/svg>$/);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  }

  static hasDimensions(svg, width, height) {
    expect(svg).toContain(`width="${width}"`);
    expect(svg).toContain(`height="${height}"`);
  }

  static hasContent(svg) {
    expect(svg).toContain('<rect');
  }
}

export class SVGStyleAssertions {
  static hasColors(svg, darkColor, lightColor) {
    expect(svg).toContain(darkColor);
    expect(svg).toContain(lightColor);
  }
}

export class ConsistencyAssertions {
  static areEqual(value1, value2) {
    expect(value1).toBe(value2);
  }

  static areDifferent(value1, value2) {
    expect(value1).not.toBe(value2);
  }
}

export class AsyncErrorAssertions {
  static async throwsAsync(promise, ErrorClass, expectedMessage = null) {
    await expect(promise).rejects.toThrow(ErrorClass);
    if (expectedMessage) {
      await expect(promise).rejects.toThrow(expectedMessage);
    }
  }
}

export class SyncErrorAssertions {
  static throws(fn, ErrorClass, expectedMessage = null) {
    expect(fn).toThrow(ErrorClass);
    if (expectedMessage) {
      expect(fn).toThrow(expectedMessage);
    }
  }

  static hasProperties(error, name, message, code = null) {
    expect(error.name).toBe(name);
    expect(error.message).toBe(message);
    if (code) {
      expect(error.code).toBe(code);
    }
  }
}

// 後方互換性のための統合クラス
export class SVGAssertions {
  static hasValidStructure = SVGStructureAssertions.isValid;
  static hasDimensions = SVGStructureAssertions.hasDimensions;
  static hasColors = SVGStyleAssertions.hasColors;
  static hasRectangles = SVGStructureAssertions.hasContent;
  static isConsistent = ConsistencyAssertions.areEqual;
}

export class ErrorAssertions {
  static throwsAsync = AsyncErrorAssertions.throwsAsync;
  static throwsSync = SyncErrorAssertions.throws;
  static hasErrorProperties = SyncErrorAssertions.hasProperties;
}