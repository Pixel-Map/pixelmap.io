import React from 'react'
import { generateWebSafeImage, rgbToHexTriplet, dimensionToPixels } from "../utils/ImageUtils";

describe('rgbToHexTriplet', () => {
    it('converts a websafe RGB to a lossless hex triplet', () => {
        expect(rgbToHexTriplet(255, 102, 0)).toBe("f60")
    })
    it('converts a 12bit RGB to a lossless hex triplet', () => {
        expect(rgbToHexTriplet(170, 187, 204)).toBe("abc")
    })
    it('converts a 24bit RGB to a lossy hex triplet', () => {
        expect(rgbToHexTriplet(171, 205, 239)).toBe("ace") // "ace" is closest to #ABCDEF
    })
})
