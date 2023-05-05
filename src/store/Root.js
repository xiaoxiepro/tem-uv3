// 第三方包
import { defineStore } from 'pinia'
import {
  getConfig,
  login,
  createOrder,
  outputPay,
  getUserInfo,
  withdraw,
  gethelpList,
  inviteCheck
} from '@/http/api'
import bsc from '@/web3/bsc'
import { getQueryString, msg, md5, notify, Fixed } from '@/utils'
import { translate } from '@/language'
import usePupStatus from "@/hooks/usePupStatus";

// 引入英文语言包
export const useRootStore = defineStore('Root', {
  state: () => {
    return {
      address: '',
      config: {},
      userInfo: {},
      usdt: {},
      token: {},
      lp: {},
      nowTime: '',
      tokenSymbol: '',
      inAddress: '',
      outAddress: '',
      inviteUrl: '',
      helpList: [],
      pledgeData: {},
      stakeMax: 0,
      stakeMin: 0,
      stakeFree: 0,
      stakeAmountArr: [],
      walletAmount: 0,
      tierArr: [],
      generationArr: [],
      pledgeOut: 0,
      telegarm: ''
    }
  },
  actions: {
    // 登录
    async login(data = {}) {
      try {
        // 连接钱包
        const address = await bsc.connect_purse()
        await bsc.networkTest({
          chainId: this.config.chain.self_config.chain_id,
          host: this.config.chain.self_config.rpc_url,
          blockExplorerUrl: this.config.chain.self_config.scan_url,
          symbol: this.config.chain.self_config.symbol,
          chainName: this.config.chain.self_config.name,
          decimals: this.config.chain.self_config.decimals
        })
        await bsc.init()
        // let ts = Date.parse(new Date()) / 1000; // 当前时间戳
        // let msg = address + '-' + ts;
        // await bsc.web3.eth.personal.sign(bsc.web3.utils.utf8ToHex(msg), address)
        // const date = new Date(`${this.config.date} GMT+8`).getTime() / 1000
        const date = this.config.date.split(' ')[0].split('-').join('')
        let code = getQueryString('referrer')
        // 调用登录接口
        const res = await login({
          address: address,
          sign: md5(`${address}.${date}`).substring(0, 10),
          ...data
        })
        if (res.info.referrer == 0 && code) {
          await inviteCheck({
            code
          })
        }
        bsc.balance(res.info.address, true).then(res => {
          this.walletAmount = res
          this.walletAmount = Fixed(this.walletAmount, 6)
        })

        this.address = res.info.address
        this.userInfo = res.info
        uni.setStorageSync('xtoken', res['x-token'])
        await this.getUserInfo()

        uni.hideLoading()
      } catch (err) {
        console.log(err)
      }
    },
    // 获取用户信息
    async getUserInfo() {
      const res = await getUserInfo()
      this.userInfo = res
      this.inviteUrl = res.recommend_url
    },
    // 获取配置信息
    async getConfig() {
      try {
        let res = await getConfig()
        if (!uni.getStorageSync('language')) {
          uni.setStorageSync('language', 'zh_CN')
        }
        // 保存配置信息
        this.config = res

        this.pledgeOut = res.config.static.pledge_out

        this.tierArr = res.config.tier
        this.generationArr = res.config.generation
        this.pledgeData = res.config.pledge
        this.nowTime = this.config.date
        this.inAddress = res.chain.inout.in_address
        this.outAddress = res.chain.inout.out_address
        this.stakeMax = res.config.pledgeNum.pledge_max
        this.stakeMin = res.config.pledgeNum.pledge_min
        this.stakeFree = res.config.pledgeNum.pledge_fee
        this.stakeAmountArr = res.config.pledgeNum.pledge_rapid
        this.defaultLanguage = this.config.language.default
        this.telegarm = res.config.telegram
        if (!uni.getStorageSync('language')) {
          uni.setStorageSync('language', this.defaultLanguage)
        }
        console.log(1111);
      } catch (err) {
        uni.hideLoading()
        console.log(err)
      }
      // 保存配置信息
    },
    async getHelpList() {
      gethelpList().then(res => {
        this.helpList = res
      })
    },
    async withdrawAction(amount) {
      const { confirmStatus } = usePupStatus();
      if (Number(this.userInfo.amount) < Number(amount) || !amount) {
        uni.showToast({
          title: translate('yuebu-zu'),
          icon: 'error',
          duration: 2000
        });
        return
      }
      uni.showLoading({ mask: true });
      withdraw({
        amount,
        outStatus: true
      }).then(async (res) => {
        console.log(res);
        await this.getUserInfo()
        uni.hideLoading();
        confirmStatus.value = false
        notify(res.msg)
      }).catch((err) => {
        console.log(err);
        if (err.data) {
          uni.showToast({
            title: err.data.msg,
            icon: 'error',
            duration: 2000
          });
        }

      })
    },
    async buyPlayerAction(obj) {
      try {
        uni.showLoading({
          mask: true,
          title: translate('jiao-yi-zhong-qing-wu-guan-bi-ye-mian'),
        })
        let uBalance = await bsc.specified_balance(
          {
            fromAccount: this.address,
            ...this.usdt,
          },
          true,
        )
        console.log('余额', uBalance)
        if (uBalance < obj.amount) {
          uni.showToast({
            title: translate('yuebu-zu'),
            icon: 'error',
            duration: 2000,
          })
          return
        }
        // 查询授权金额
        let authorizeAmount = await bsc.queryingAuthorizationAmount(
          {
            fromAccount: this.address,
            toAccount: this.base.contract,
            ...this.usdt,
          },
          true,
        )
        console.log('授权', authorizeAmount)
        if (authorizeAmount < obj.amount) {
          await bsc.getTest({
            authorizeAmount: obj.amount,
            fromAccount: this.address,
            toAccount: this.base.contract,
            ...this.usdt,
          })
        }
        let frequency = 1
        let request = () => {
          bsc
            .queryingAuthorizationAmount(
              {
                fromAccount: this.address,
                toAccount: this.base.contract,
                ...this.usdt,
              },
              true,
            )
            .then((res) => {
              console.log('授权', res)
              if (res >= obj.amount) {
                this.aa({
                  amount: obj.amount
                })
              } else if (res < obj.amount && frequency <= 20) {
                setTimeout(request, 2000)
                frequency++
              } else {
                uni.hideLoading()
                notify(translate('cha-xun-shi-bai'), 2000, { background: '#ee0a24' })
              }
            })
            .catch((err) => {
              uni.hideLoading()
              notify(translate('jiao-yi-shi-bai'), 2000, { background: '#ee0a24' })
              console.log(err)
            })
        }
        request()
      } catch (err) {
        console.log(err)
      }
    },
    async aa(obj, callback) {
      try {
        await this.getConfig()
        const orderObj = await createOrder({
          type: 'ido',
          qty: obj.amount,
        })
        bsc
          .sendInAmount({
            fromAccount: this.address,
            uaddress: this.usdt.contract,
            address1: this.userInfo.re_address,
            address2: this.userInfo.leader_address,
            amount: obj.amount,
            scale1: this.config.config.extension.recommend_reward || 0,
            scale2: this.config.config.extension.team_reward || 0,
            inAddress: this.inAddress,
            usdt: this.usdt,
            ...this.base,
          })
          .then(async (transactionHash) => {
            try {
              await outputPay({
                order_no: orderObj.order_no,
                tx_id: transactionHash,
                outStatus: true,
              })
            } catch (err) {
              console.log(err);
            }
            let a = 0
            const queryOrder = async () => {
              const res = await bsc.getTransaction(transactionHash)
              console.log(res);
              if (a > 7) {
                try {
                  await outputPay({
                    order_no: orderObj.order_no,
                    tx_id: transactionHash,
                    outStatus: true,
                  })
                  uni.showToast({
                    title: translate('cc'),
                    duration: 2000
                  });
                } catch (err) {
                  uni.showToast({
                    title: translate('cc'),
                    duration: 2000
                  });
                  console.log(err);
                }
              }
              else if (res && res?.blockHash && res?.status) {
                let num = 1
                let request1 = () => {
                  console.log(111111111);
                  outputPay({
                    order_no: orderObj.order_no,
                    tx_id: transactionHash,
                    outStatus: true,
                  })
                    .then(async (res) => {
                      console.log(res.code)
                      if (res.code == 200) {
                        if (callback) {
                          await callback()
                        }
                        await this.getUserInfo()
                        uni.hideLoading()
                        notify(translate('gou-mai-cheng-gong'))
                      } else if (res.code != 200 && num <= 20) {
                        num++
                        setTimeout(request1, 2000)
                      } else {
                        uni.hideLoading()
                        notify(translate('gou-mai-shi-bai'), 2000, { background: '#ee0a24' })
                      }
                    })
                    .catch((err) => {
                      if (err.data.code != 200 && num <= 20) {
                        num++
                        setTimeout(request1, 2000)
                      } else {
                        uni.hideLoading()
                        notify(translate('gou-mai-shi-bai'), 2000, { background: '#ee0a24' })
                      }
                      console.log(err)
                    })
                }
                request1()
              } else if (res && !res?.status) {
                uni.hideLoading()
                notify(translate('gou-mai-shi-bai'), 2000, { background: '#ee0a24' })
              } else {
                a++
                setTimeout(queryOrder, 2000)
              }
            }
            queryOrder()
          })
          .catch((err) => {
            uni.hideLoading()
            notify(translate('gou-mai-shi-bai-0'), 2000, { background: '#ee0a24' })
            console.log(err)
          })
      } catch (err) {
        uni.hideLoading()
        notify(translate('jiao-yi-shi-bai'), 2000, { background: '#ee0a24' })
      }
    },
    async buyPlayerAction1(amount, fun) {
      const { confirmStatus } = usePupStatus();
      try {
        uni.showLoading({
          mask: true,
          title: translate('jiao-yi-zhong-qing-wu-guan-bi-ye-mian'),
        })
        this.walletAmount = await bsc.balance(this.address, true)
        this.walletAmount = Fixed(this.walletAmount, 6)
        if (Number(amount) > Number(this.walletAmount)) {
          uni.showToast({
            mask: true,
            icon: "error",
            title: translate('yuebu-zu'),
          })
          return
        }
        const orderObj = await createOrder({
          total: amount,
        })
        bsc
          .request({
            fromAddress: this.address,
            toAddress: this.inAddress,
            quantity: amount,
          })
          .then(async (transactionHash) => {
            try {
              await outputPay({
                order_no: orderObj.order_no,
                tx_id: transactionHash,
                outStatus: true,
              })
            } catch (err) {
              console.log(err);
            }
            const queryOrder = async () => {
              const res = await bsc.getTransaction(transactionHash)
              if (res && res?.blockHash && res?.status) {
                let num = 1
                let request1 = () => {
                  outputPay({
                    order_no: orderObj.order_no,
                    tx_id: transactionHash,
                    outStatus: true,
                  })
                    .then(async (res) => {
                      console.log(res.code)
                      if (res.code == 200) {
                        this.getUserInfo()
                        this.getConfig()
                        if (fun) {
                          await fun()
                        }
                        this.walletAmount = await bsc.balance(this.address, true)
                        this.walletAmount = Fixed(this.walletAmount, 6)
                        uni.hideLoading()
                        confirmStatus.value = false
                        notify(translate('jiao-yi-cheng-gong'))
                      }
                    })
                    .catch((err) => {
                      console.log(err)
                      if (err.data.code != 200 && num <= 20) {
                        num++
                        setTimeout(request1, 2000)
                      } else {
                        uni.hideLoading()
                        notify(translate('jiao-yi-shi-bai'), 2000, { background: '#ee0a24' })
                      }
                    })
                }
                request1()
              } else if (res && !res?.status) {
                uni.hideLoading()
                notify(translate('jiao-yi-shi-bai'), 2000, { background: '#ee0a24' })
              } else {
                setTimeout(queryOrder, 2000)
              }
            }
            queryOrder()
          })
          .catch((err) => {
            uni.hideLoading()
            notify(translate('jiao-yi-shi-bai'), 2000, { background: '#ee0a24' })
            console.log(err)
          })
      } catch (err) {
        console.log(err)
      }
    },
  },
})
