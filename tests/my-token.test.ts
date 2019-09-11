import { ContractMeta, Awaiter, Assertion } from '@libotony/sharp'
import { assert } from 'chai'
import { connex, wallet } from './connex-loader'
import { toWei, fromWei } from './utils'

const myTokenContract = require('../output/MyToken.json')
const myToken = new ContractMeta(myTokenContract.abi, myTokenContract.bytecode)

const thor = connex.thor
const vendor = connex.vendor

let address = ''
const zeroAddress = '0x' + '00'.repeat(20)
const addrOne = wallet.list[0].address
const addrTwo = wallet.list[1].address
const addrThree = wallet.list[2].address

describe('MyToken', () => {

    it('deploy contract', async () => {
        const clause = myToken.deploy().asClause()
        const { txid } = await vendor.sign('tx').request([clause])
        const receipt = await Awaiter.receipt(thor.transaction(txid), thor.ticker())

        assert.isFalse(receipt.reverted, 'Should not be reverted')
        assert.equal(receipt.outputs[0].events.length, 2, 'Clause#0 should emit two events')
        assert.isTrue(!!receipt.outputs[0].contractAddress)

        address = receipt.outputs[0].contractAddress!

        Assertion
            .event(myToken.ABI('Transfer', 'event'))
            .by(address)
            .logs(zeroAddress, addrOne, toWei(1e9))
            .equal(receipt.outputs[0].events[1])
    })

    describe('token basics', () => {

        it('account#0 balance', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('balanceOf'))
                .call(addrOne)

            Assertion
                .method(myToken.ABI('balanceOf'))
                .outputs(toWei(1e9))
                .equal(ret)
        })

        it('totalSupply', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('totalSupply'))
                .call()

            Assertion
                .method(myToken.ABI('totalSupply'))
                .outputs(toWei(1e9))
                .equal(ret)
        })

        it('name', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('name'))
                .call()

            Assertion
                .method(myToken.ABI('name'))
                .outputs('MyToken')
                .equal(ret)
        })

        it('symbol', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('symbol'))
                .call()

            Assertion
                .method(myToken.ABI('symbol'))
                .outputs('MT')
                .equal(ret)
        })

        it('decimals', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('decimals'))
                .call()

            Assertion
                .method(myToken.ABI('decimals'))
                .outputs('18')
                .equal(ret)

        })

    })

    describe('transfer', async () => {

        it('transfer not enough amount should revert', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('transfer'))
                .caller(addrTwo)
                .call(addrOne, toWei(100))

            Assertion
                .revert()
                .with('VIP180: transfer amount exceeds balance')
                .equal(ret)
        })

        it('transfer from zero address should revert', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('transfer'))
                .caller(zeroAddress)
                .call(addrOne, toWei(100))

            Assertion
                .revert()
                .with('VIP180: transfer from the zero address')
                .equal(ret)
        })

        it('transfer to zero address should revert', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('transfer'))
                .caller(addrOne)
                .call(zeroAddress, toWei(100))

            Assertion
                .revert()
                .with('VIP180: transfer to the zero address')
                .equal(ret)
        })

    })

    describe('transfer and balanceOf', async () => {

        it('transfer should emit Transfer', async () => {
            const { txid } = await vendor.sign('tx')
                .signer(addrOne)
                .request([
                    thor.account(address)
                        .method(myToken.ABI('transfer'))
                        .asClause(addrTwo, toWei(100))
                ])

            const receipt = await Awaiter.receipt(thor.transaction(txid), thor.ticker())

            assert.isFalse(receipt.reverted, 'Should not be reverted')
            assert.equal(receipt.outputs[0].events.length, 1, 'Clause#0 should emit one event')
            Assertion
                .event(myToken.ABI('Transfer', 'event'))
                .by(address)
                .logs(addrOne, addrTwo, toWei(100))
                .equal(receipt.outputs[0].events[0])
        })

        it('after transfer, check addrOne balance', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('balanceOf'))
                .call(addrOne)

            Assertion
                .method(myToken.ABI('balanceOf'))
                .outputs(toWei(1e9 - 100))
                .equal(ret)
        })

        it('after transfer, check addrTwo balance', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('balanceOf'))
                .call(addrTwo)

            Assertion
                .method(myToken.ABI('balanceOf'))
                .outputs(toWei(100))
                .equal(ret)
        })

    })

    describe('approve', async () => {

        it('approve from zero address should revert', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('approve'))
                .caller(zeroAddress)
                .call(addrOne, toWei(100))

            Assertion
                .revert()
                .with('VIP180: approve from the zero address')
                .equal(ret)
        })

        it('approve to zero address should revert', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('approve'))
                .caller(addrOne)
                .call(zeroAddress, toWei(100))

            Assertion
                .revert()
                .with('VIP180: approve to the zero address')
                .equal(ret)
        })

        it('approve should emit Approval event', async () => {

            const { txid } = await vendor.sign('tx')
                .signer(addrOne)
                .request([
                    thor.account(address)
                        .method(myToken.ABI('approve'))
                        .asClause(addrTwo, toWei(100))
                ])

            const receipt = await Awaiter.receipt(thor.transaction(txid), thor.ticker())

            assert.isFalse(receipt.reverted, 'Should not be reverted')
            assert.equal(receipt.outputs[0].events.length, 1, 'Clause#0 should emit one event')
            Assertion
                .event(myToken.ABI('Approval', 'event'))
                .by(address)
                .logs(addrOne, addrTwo, toWei(100))
                .equal(receipt.outputs[0].events[0])
        })

    })

    describe('allowance and transferFrom', async () => {

        it('allowance should be zero in the first time', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('allowance'))
                .call(addrTwo, addrOne)

            Assertion
                .method(myToken.ABI('allowance'))
                .outputs('0')
                .equal(ret)
        })

        it('addrTwo should have allowance from addrOne', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('allowance'))
                .call(addrOne, addrTwo)

            Assertion
                .method(myToken.ABI('allowance'))
                .outputs(toWei('100'))
                .equal(ret)
        })

        it('transferFrom greater amount should revert', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('transferFrom'))
                .caller(addrTwo)
                .call(addrOne, addrThree, toWei(101))

            Assertion
                .revert()
                .with('VIP180: transfer amount exceeds allowance')
                .equal(ret)
        })

        it('transferFrom should emit Transfer and Approval event', async () => {
            const { txid } = await vendor.sign('tx')
                .signer(addrTwo)
                .request([
                    thor.account(address)
                        .method(myToken.ABI('transferFrom'))
                        .asClause(addrOne, addrThree, toWei(50))
                ])

            const receipt = await Awaiter.receipt(thor.transaction(txid), thor.ticker())

            assert.isFalse(receipt.reverted, 'Should not be reverted')
            assert.equal(receipt.outputs[0].events.length, 2, 'Clause#0 should emit two events')
            Assertion
                .event(myToken.ABI('Transfer', 'event'))
                .by(address)
                .logs(addrOne, addrThree, toWei(50))
                .equal(receipt.outputs[0].events[0])
            Assertion
                .event(myToken.ABI('Approval', 'event'))
                .by(address)
                .logs(addrOne, addrTwo, toWei(50))
                .equal(receipt.outputs[0].events[1])

        })

        it('after transferFrom, check addrOne balance', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('balanceOf'))
                .call(addrOne)

            Assertion
                .method(myToken.ABI('balanceOf'))
                .outputs(toWei(1e9 - 100 - 50))
                .equal(ret)
        })

        it('after transferFrom, check addrThree balance', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('balanceOf'))
                .call(addrThree)

            Assertion
                .method(myToken.ABI('balanceOf'))
                .outputs(toWei(50))
                .equal(ret)
        })

        it('after transferFrom, check addrTwo\'s allowance from addrOne', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('allowance'))
                .call(addrOne, addrTwo)

            Assertion
                .method(myToken.ABI('allowance'))
                .outputs(toWei('50'))
                .equal(ret)
        })

    })

    describe('increaseAllowance and decreaseAllowance', async () => {

        it('decreaseAllowance greater than allowance should revert', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('decreaseAllowance'))
                .caller(addrOne)
                .call(addrTwo, toWei(51))

            Assertion
                .revert()
                .with('VIP180: decreased allowance below zero')
                .equal(ret)
        })

        it('decreaseAllowance should emit Approval event', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('decreaseAllowance'))
                .caller(addrOne)
                .call(addrTwo, toWei(10))

            assert.isFalse(ret.reverted, 'Should not be reverted')
            assert.equal(ret.events.length, 1, 'Should emit one event')
            Assertion
                .event(myToken.ABI('Approval', 'event'))
                .by(address)
                .logs(addrOne, addrTwo, toWei(40))
                .equal(ret.events[0])
        })

        it('increaseAllowance should emit Approval event', async () => {
            const ret = await thor.account(address)
                .method(myToken.ABI('increaseAllowance'))
                .caller(addrOne)
                .call(addrTwo, toWei(10))

            assert.isFalse(ret.reverted, 'Should not be reverted')
            assert.equal(ret.events.length, 1, 'Should emit one event')
            Assertion
                .event(myToken.ABI('Approval', 'event'))
                .by(address)
                .logs(addrOne, addrTwo, toWei(60))
                .equal(ret.events[0])
        })

    })

})
