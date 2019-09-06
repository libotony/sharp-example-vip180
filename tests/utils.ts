import { BigNumber } from 'bignumber.js'

export const toWei = (input: string | number) => {
    return new BigNumber(input).times(new BigNumber(1e18)).toString(10)
}

export const fromWei = (input: string | number) => {
    return new BigNumber(input).div(new BigNumber(1e18)).toString(10)
}
