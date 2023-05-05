import { translate } from '@/language'
const protocol = window.location.protocol
const host = window.location.host
const BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://api.posdefi.bsc-tron.top'
    : protocol + '//api.' + host
export const http = (options, customOptions) => {
  // 自定义配置
  // eslint-disable-next-line camelcase
  let custom_options = Object.assign(
    {
      loading: false, // 是否开启loading层效果, 默认为false
      message: false, // 是否使用后端返回 message, 默认为false
    },
    customOptions,
  )
  /**
   * 加载动画
   * */
  // 开始加载
  function startLoading() {
    // eslint-disable-next-line camelcase
    custom_options.loading &&
      uni.showLoading({
        mask: true,
      })
  }
  startLoading()

  // 结束加载
  function endLoading() {
    custom_options.loading && uni.hideLoading()
  }

  // 提示信息
  function Toast(params) {
    // eslint-disable-next-line camelcase
    custom_options.message &&
      uni.showToast({
        icon: params.name,
        title: params.msg,
      })
  }
  return new Promise((resolve, reject) => {
    if (!window.ethereum) {
      uni.showToast({
        icon: 'none',
        title: translate('aa'),
      })
      return
    }
    uni.request({
      url: BASE_URL + options.url, //接收请求的API
      method: options.method || 'GET', //接收请求的方式,如果不传默认为GET
      data: options.data || {}, //接收请求的data,不传默认为空
      timeout: 30000,
      header: {
        'Content-Type': 'application/json',
        'x-token': uni.getStorageSync('xtoken') ? uni.getStorageSync('xtoken') : '',
        language: uni.getStorageSync('language') ? uni.getStorageSync('language') : '',
      },
      success: (response) => {
        let obj = options.data || {}
        try {
          switch (response.code || response?.data?.code || response?.data?.data?.code || response.statusCode) {
            case 200:
              if (obj.outStatus) {
                resolve(response.data)
              } else {
                resolve(response.data.data || response.data)
              }
              break
            default:
              if (!obj.outStatus) {
                uni.showToast({
                  mask: true,
                  icon: 'error',
                  title: response?.msg || response?.data?.msg || response?.data?.data?.msg || translate('wang-luo-cuo-wu'),
                })
              }
              reject(response)
              break
          }
        } catch (error) {
          reject(error)
        }
      },
      fail: (err) => {
        endLoading()
        uni.showToast({
          icon: 'error',
          title: translate('wang-luo-cuo-wu'),
        })
        reject(err)
      },
      complete: () => {
        //  关闭加载动画
        endLoading()
      },
    })
  })
}
