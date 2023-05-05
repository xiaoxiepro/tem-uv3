import { http } from './http'
// 获取配置信息
export function getConfig() {
  return http({
    url: '/api/common/config',
    method: 'GET',
  })
}
// 登录
export function login(data) {
  return http({
    url: '/api/common/login',
    method: 'POST',
    data,
  })
}
// 绑定推荐人
export function inviteCheck(data) {
  return http({
    url: '/api/user/inviteCheck',
    method: 'POST',
    data,
  })
}
// 获取质押记录
export function getPledgeList(data) {
  return http({
    url: '/api/playing/pledgeList',
    method: 'GET',
    data,
  },
    {
      loading: true,
    })
}
// 获取资金记录
export function getEarnings(data) {
  return http({
    url: '/api/playing/earnings',
    method: 'GET',
    data,
  },
    {
      loading: true,
    })
}
// 获取推荐列表
export function getInviteList(data) {
  return http({
    url: '/api/user/inviteList',
    method: 'GET',
    data,
  },
    {
      loading: true,
    })
}
export function myTeam(data) {
  return http({
    url: '/api/playing/myTeam',
    method: 'GET',
    data,
  },
    {
      loading: true,
    })
}
// 获取推荐列表
export function getPromotion(data) {
  return http({
    url: '/api/common/promotion',
    method: 'GET',
    data,
  },
    {
      loading: true,
    })
}
// 创建订单
export function createOrder(data) {
  return http({
    url: '/api/order/createOrder',
    method: 'POST',
    data,
  })
}

export function gethelpList() {
  return http({
    url: '/api/common/help',
    method: 'GET',
  })
}
// 支付购买
export function outputPay(data) {
  return http({
    url: '/api/order/pledgeBuy',
    method: 'POST',
    data,
  })
}
export function getUserInfo() {
  return http({
    url: '/api/user',
    method: 'GET',
  })
}

export function withdraw(data) {
  return http({
    url: '/api/userWithdraw/apply',
    method: 'POST',
    data,
  })
}
