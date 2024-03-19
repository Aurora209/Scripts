/*
cron "30 9,21 * * *" jd_bean_change.js, tag:资产变化强化版by-ccwav
 */

//详细说明参考 https://github.com/ccwav/QLScript2.

const $ = new Env('京东资产统计');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let NowHour = new Date().getHours();

//默认开启缓存模式
let checkbeanDetailMode = 1;
if ($.isNode() && process.env.BEANCHANGE_BEANDETAILMODE) {
    checkbeanDetailMode = process.env.BEANCHANGE_BEANDETAILMODE * 1;
}

const fs = require('fs');
const CR = require('crypto-js');
const moment = require("moment");
let matchtitle = "昨日";
let yesterday = "";
let TodayDate = "";
let startDate = "";
let endDate = "";
try {
    yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
    TodayDate = moment().format("YYYY-MM-DD");
    startDate = moment().startOf("month").format("YYYY_MM");
    endDate = moment().endOf("month").format("YYYY-MM-DD");
} catch (e) {
    console.log("依赖缺失，请先安装依赖moment!");
    return
}

if (!fs.existsSync("./BeanCache")) {
    fs.mkdirSync("./BeanCache");
}

let strBeanCache = "./BeanCache/" + yesterday + ".json";
let strNewBeanCache = "./BeanCache/" + TodayDate + ".json";
let TodayCache = [];
let Fileexists = fs.existsSync(strBeanCache);
let TempBeanCache = [];
if (!Fileexists) {
    yesterday = TodayDate;
    strBeanCache = strNewBeanCache;
    Fileexists = fs.existsSync(strBeanCache);
    matchtitle = "今日";
}
if (Fileexists) {
    console.log("检测到资产变动缓存文件" + yesterday + ".json，载入...");
    TempBeanCache = fs.readFileSync(strBeanCache, 'utf-8');
    if (TempBeanCache) {
        TempBeanCache = TempBeanCache.toString();
        TempBeanCache = JSON.parse(TempBeanCache);
    }
}

Fileexists = fs.existsSync(strNewBeanCache);
if (Fileexists) {
    console.log("检测到资产变动缓存文件" + TodayDate + ".json，载入...");
    TodayCache = fs.readFileSync(strNewBeanCache, 'utf-8');
    if (TodayCache) {
        TodayCache = TodayCache.toString();
        TodayCache = JSON.parse(TodayCache);
    }
}


let allMessage = '';
let allMessage2 = '';
let allReceiveMessage = '';
let allWarnMessage = '';
let ReturnMessage = '';
let ReturnMessageMonth = '';
let allMessageMonth = '';

let MessageUserGp2 = '';
let ReceiveMessageGp2 = '';
let WarnMessageGp2 = '';
let allMessageGp2 = '';
let allMessage2Gp2 = '';
let allMessageMonthGp2 = '';
let IndexGp2 = 0;

let MessageUserGp3 = '';
let ReceiveMessageGp3 = '';
let WarnMessageGp3 = '';
let allMessageGp3 = '';
let allMessage2Gp3 = '';
let allMessageMonthGp3 = '';
let IndexGp3 = 0;

let MessageUserGp4 = '';
let ReceiveMessageGp4 = '';
let WarnMessageGp4 = '';
let allMessageGp4 = '';
let allMessageMonthGp4 = '';
let allMessage2Gp4 = '';
let IndexGp4 = 0;

let notifySkipList = "";
let IndexAll = 0;
let EnableMonth = "false";
let isSignError = false;
let ReturnMessageTitle = "";
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '';
const JD_API_HOST = 'https://api.m.jd.com/client.action';
let intPerSent = 0;
let i = 0;
let llShowMonth = false;
let Today = new Date();
let strAllNotify = "";
let strSubNotify = "";
let llPetError = false;
let strGuoqi = "";
let RemainMessage = '\n';
RemainMessage += "⭕提醒:⭕" + '\n';
RemainMessage += '【特价金币】特价版APP->我的->金币(可兑换无门槛红包)\n';
RemainMessage += '【话费积分】APP->充值中心-赚积分兑话费（180天效期）\n';
RemainMessage += '【礼品卡额】APP->我的->礼品卡（包含E卡，品牌类卡，超市卡）\n';
RemainMessage += '【超市卡】APP首页->京东超市->超市卡（超市商品可用）\n';
RemainMessage += '【老农场】APP->我的->东东农场->回旧版,完成可兑换无门槛红包,可用于任意商品\n';
RemainMessage += '【新农场】APP->我的->东东农场,完成可在记录里查看奖品\n';
RemainMessage += '【其他】不同类别红包不能叠加使用，自测';

let WP_APP_TOKEN_ONE = "";

let TempBaipiao = "";
let llgeterror = false;
let time = new Date().getHours();
if ($.isNode()) {
    if (process.env.WP_APP_TOKEN_ONE) {
        WP_APP_TOKEN_ONE = process.env.WP_APP_TOKEN_ONE;
    }
}
//if(WP_APP_TOKEN_ONE)
//console.log(`检测到已配置Wxpusher的Token，启用一对一推送...`);
//else
//console.log(`检测到未配置Wxpusher的Token，禁用一对一推送...`);

let jdSignUrl = 'https://api.nolanstore.cc/sign'
if (process.env.SIGNURL)
    jdSignUrl = process.env.SIGNURL;

let epsignurl = ""
if (process.env.epsignurl)
    epsignurl = process.env.epsignurl;

if ($.isNode() && process.env.BEANCHANGE_PERSENT) {
    intPerSent = parseInt(process.env.BEANCHANGE_PERSENT);
    console.log(`检测到设定了分段通知:` + intPerSent);
}

if ($.isNode() && process.env.BEANCHANGE_USERGP2) {
    MessageUserGp2 = process.env.BEANCHANGE_USERGP2 ? process.env.BEANCHANGE_USERGP2.split('&') : [];
    intPerSent = 0; //分组推送，禁用账户拆分
    console.log(`检测到设定了分组推送2,将禁用分段通知`);
}

if ($.isNode() && process.env.BEANCHANGE_USERGP3) {
    MessageUserGp3 = process.env.BEANCHANGE_USERGP3 ? process.env.BEANCHANGE_USERGP3.split('&') : [];
    intPerSent = 0; //分组推送，禁用账户拆分
    console.log(`检测到设定了分组推送3,将禁用分段通知`);
}

if ($.isNode() && process.env.BEANCHANGE_USERGP4) {
    MessageUserGp4 = process.env.BEANCHANGE_USERGP4 ? process.env.BEANCHANGE_USERGP4.split('&') : [];
    intPerSent = 0; //分组推送，禁用账户拆分
    console.log(`检测到设定了分组推送4,将禁用分段通知`);
}

//取消月结查询
//if ($.isNode() && process.env.BEANCHANGE_ENABLEMONTH) {
//EnableMonth = process.env.BEANCHANGE_ENABLEMONTH;
//}

if ($.isNode() && process.env.BEANCHANGE_SUBNOTIFY) {
    strSubNotify = process.env.BEANCHANGE_SUBNOTIFY;
    strSubNotify += "\n";
    console.log(`检测到预览置顶内容,将在一对一推送的预览显示...\n`);
}

if ($.isNode() && process.env.BEANCHANGE_ALLNOTIFY) {
    strAllNotify = process.env.BEANCHANGE_ALLNOTIFY;
    console.log(`检测到设定了公告,将在推送信息中置顶显示...`);
    strAllNotify = "✨✨✨✨✨✨✨公告✨✨✨✨✨✨✨\n" + strAllNotify;
    console.log(strAllNotify + "\n");
    strAllNotify += "\n🎏🎏🎏🎏🎏🎏🎏🎏🎏🎏🎏🎏🎏🎏🎏\n"
}


if (EnableMonth == "true" && Today.getDate() == 1 && Today.getHours() > 17)
    llShowMonth = true;

let userIndex2 = -1;
let userIndex3 = -1;
let userIndex4 = -1;


if ($.isNode()) {
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    })
    if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false')
        console.log = () => { };
} else {
    cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}

//查询开关
let strDisableList = "";
let DisableIndex = -1;
if ($.isNode()) {
    strDisableList = process.env.BEANCHANGE_DISABLELIST ? process.env.BEANCHANGE_DISABLELIST.split('&') : [];
}

//老农场
let EnableJdFruit = true;
DisableIndex = strDisableList.findIndex((item) => item === "老农场");
if (DisableIndex != -1) {
    console.log("检测到设定关闭老农场查询");
    EnableJdFruit = false;
}

//特价金币
let EnableJdSpeed = true;
DisableIndex = strDisableList.findIndex((item) => item === "极速金币");
if (DisableIndex != -1) {
    console.log("检测到设定关闭特价金币查询");
    EnableJdSpeed = false;
}

//领现金
let EnableCash = true;
DisableIndex = strDisableList.findIndex((item) => item === "领现金");
if (DisableIndex != -1) {
    console.log("检测到设定关闭领现金查询");
    EnableCash = false;
}

//7天过期京豆
let EnableOverBean = true;
DisableIndex = strDisableList.findIndex((item) => item === "过期京豆");
if (DisableIndex != -1) {
    console.log("检测到设定关闭过期京豆查询");
    EnableOverBean = false
}

//查优惠券
let EnableChaQuan = false;
DisableIndex = strDisableList.findIndex((item) => item === "查优惠券");
if (DisableIndex != -1) {
    console.log("检测到设定关闭优惠券查询");
    EnableChaQuan = false
}

DisableIndex = strDisableList.findIndex((item) => item === "活动攻略");
if (DisableIndex != -1) {
    console.log("检测到设定关闭活动攻略显示");
    RemainMessage = "";
}

//汪汪赛跑
let EnableJoyRun = true;
DisableIndex = strDisableList.findIndex((item) => item === "汪汪赛跑");
if (DisableIndex != -1) {
    console.log("检测到设定关闭汪汪赛跑查询");
    EnableJoyRun = false
}

//京豆收益查询
let EnableCheckBean = true;
DisableIndex = strDisableList.findIndex((item) => item === "京豆收益");
if (DisableIndex != -1) {
    console.log("检测到设定关闭京豆收益查询");
    EnableCheckBean = false
}



!(async () => {
    if (!cookiesArr[0]) {
        $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {
            "open-url": "https://bean.m.jd.com/bean/signIndex.action"
        });
        return;
    }
    for (i = 0; i < cookiesArr.length; i++) {
        if (cookiesArr[i]) {
            cookie = cookiesArr[i];
            $.pt_pin = (cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
            $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
            $.CryptoJS = $.isNode() ? require('crypto-js') : CryptoJS;
            $.index = i + 1;
            $.beanCount = 0;
            $.incomeBean = 0;
            $.expenseBean = 0;
            $.todayIncomeBean = 0;
            $.todayOutcomeBean = 0;
            $.errorMsg = '';
            $.isLogin = true;
            $.nickName = '';
            $.levelName = '';
            $.message = '';
            $.balance = 0;
            $.expiredBalance = 0;
            $.JdFarmProdName = '';
            $.JdtreeEnergy = 0;
            $.JdtreeTotalEnergy = 0;
            $.treeState = 0;
            $.JdwaterTotalT = 0;
            $.JdwaterD = 0;
            $.JDwaterEveryDayT = 0;
            $.JDtotalcash = 0;
            $.jdCash = 0;
            $.isPlusVip = false;
            $.isRealNameAuth = false;
            $.JingXiang = "";
            $.allincomeBean = 0; //月收入
            $.allexpenseBean = 0; //月支出
            $.beanChangeXi = 0;
            $.YunFeiTitle = "";
            $.YunFeiQuan = 0;
            $.YunFeiQuanEndTime = "";
            $.YunFeiTitle2 = "";
            $.YunFeiQuan2 = 0;
            $.YunFeiQuanEndTime2 = "";
            $.JoyRunningAmount = "";
            $.ECardinfo = "";
            $.PlustotalScore = 0;
            $.CheckTime = "";
            $.beanCache = 0;
            $.fruitnewinfo = '';
            $.newfarm_info = '';
            TempBaipiao = "";
            strGuoqi = "";

            console.log(`******开始查询【京东账号${$.index}】${$.nickName || $.UserName}*********`);
            $.UA = require('./USER_AGENTS').UARAM();
            await TotalBean();
            //await TotalBean2();
            if ($.beanCount == 0) {
                console.log("数据获取失败，等待30秒后重试....")
                await $.wait(30 * 1000);
                await TotalBean();
            }
            if ($.beanCount == 0) {
                console.log("疑似获取失败,等待10秒后用第二个接口试试....")
                await $.wait(10 * 1000);
                var userdata = await getuserinfo();
                if (userdata.code == 1) {
                    $.beanCount = userdata.content.jdBean;
                }
            }


            if (!$.isLogin) {
                await isLoginByX1a0He();
            }
            if (!$.isLogin) {
                $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
                    "open-url": "https://bean.m.jd.com/bean/signIndex.action"
                });

                if ($.isNode()) {
                    await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
                }
                continue
            }

            if (TempBeanCache) {
                for (let j = 0; j < TempBeanCache.length; j++) {
                    if (TempBeanCache[j].pt_pin == $.UserName) {
                        $.CheckTime = TempBeanCache[j].CheckTime;
                        $.beanCache = TempBeanCache[j].BeanNum;
                        break;
                    }
                }
            }

            var llfound = false;
            var timeString = "";
            var nowHour = new Date().getHours();
            var nowMinute = new Date().getMinutes();
            if (nowHour < 10)
                timeString += "0" + nowHour + ":";
            else
                timeString += nowHour + ":";

            if (nowMinute < 10)
                timeString += "0" + nowMinute;
            else
                timeString += nowMinute;

            if (TodayCache) {
                for (let j = 0; j < TodayCache.length; j++) {
                    if (TodayCache[j].pt_pin == $.UserName) {
                        TodayCache[j].CheckTime = timeString;
                        TodayCache[j].BeanNum = $.beanCount;
                        llfound = true;
                        break;
                    }
                }
            }
            if (!llfound) {

                var tempAddCache = {
                    "pt_pin": $.UserName,
                    "CheckTime": timeString,
                    "BeanNum": $.beanCount
                };
                TodayCache.push(tempAddCache);
            }

            await getjdfruitinfo(); //老农场
            await $.wait(1000);
            await fruitnew();
            await checkplus();
            await Promise.all([
                cash(), //特价金币
                bean(), //京豆查询
                //jdCash(), //领现金
                //GetJoyRuninginfo(), //汪汪赛跑
                queryScores(),
                getek(),
                newfarm_info()
            ])

            await showMsg();
            if (intPerSent > 0) {
                if ((i + 1) % intPerSent == 0) {
                    console.log("分段通知条件达成，处理发送通知....");
                    if ($.isNode() && allMessage) {
                        var TempMessage = allMessage;
                        if (strAllNotify)
                            allMessage = strAllNotify + `\n` + allMessage;

                        await notify.sendNotify(`${$.name}`, `${allMessage}`, {
                            url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
                        }, undefined, TempMessage)
                    }
                    if ($.isNode() && allMessageMonth) {
                        await notify.sendNotify(`京东月资产统计`, `${allMessageMonth}`, {
                            url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
                        })
                    }
                    allMessage = "";
                    allMessageMonth = "";
                }

            }
        }
    }

    var str = JSON.stringify(TodayCache, null, 2);
    fs.writeFile(strNewBeanCache, str, function (err) {
        if (err) {
            console.log(err);
            console.log("添加缓存" + TodayDate + ".json失败!");
        } else {
            console.log("添加缓存" + TodayDate + ".json成功!");
        }
    })

    //组1通知
    if (ReceiveMessageGp4) {
        allMessage2Gp4 = `【⏰商品白嫖清单⏰】\n` + ReceiveMessageGp4;
    }
    if (WarnMessageGp4) {
        if (allMessage2Gp4) {
            allMessage2Gp4 = `\n` + allMessage2Gp4;
        }
        allMessage2Gp4 = `【⏰商品白嫖活动任务提醒⏰】\n` + WarnMessageGp4 + allMessage2Gp4;
    }

    //组2通知
    if (ReceiveMessageGp2) {
        allMessage2Gp2 = `【⏰商品白嫖清单⏰】\n` + ReceiveMessageGp2;
    }
    if (WarnMessageGp2) {
        if (allMessage2Gp2) {
            allMessage2Gp2 = `\n` + allMessage2Gp2;
        }
        allMessage2Gp2 = `【⏰商品白嫖活动任务提醒⏰】\n` + WarnMessageGp2 + allMessage2Gp2;
    }

    //组3通知
    if (ReceiveMessageGp3) {
        allMessage2Gp3 = `【⏰商品白嫖清单⏰】\n` + ReceiveMessageGp3;
    }
    if (WarnMessageGp3) {
        if (allMessage2Gp3) {
            allMessage2Gp3 = `\n` + allMessage2Gp3;
        }
        allMessage2Gp3 = `【⏰商品白嫖活动任务提醒⏰】\n` + WarnMessageGp3 + allMessage2Gp3;
    }

    //其他通知
    if (allReceiveMessage) {
        allMessage2 = `【⏰商品白嫖清单⏰】\n` + allReceiveMessage;
    }
    if (allWarnMessage) {
        if (allMessage2) {
            allMessage2 = `\n` + allMessage2;
        }
        allMessage2 = `【⏰商品白嫖活动任务提醒⏰】\n` + allWarnMessage + allMessage2;
    }

    if (intPerSent > 0) {
        //console.log("分段通知还剩下" + cookiesArr.length % intPerSent + "个账号需要发送...");
        if (allMessage || allMessageMonth) {
            console.log("分段通知收尾，处理发送通知....");
            if ($.isNode() && allMessage) {
                var TempMessage = allMessage;
                if (strAllNotify)
                    allMessage = strAllNotify + `\n` + allMessage;

                await notify.sendNotify(`${$.name}`, `${allMessage}`, {
                    url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
                }, undefined, TempMessage)
            }
            if ($.isNode() && allMessageMonth) {
                await notify.sendNotify(`京东月资产统计`, `${allMessageMonth}`, {
                    url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
                })
            }
        }
    } else {

        if ($.isNode() && allMessageGp2) {
            var TempMessage = allMessageGp2;
            if (strAllNotify)
                allMessageGp2 = strAllNotify + `\n` + allMessageGp2;
            await notify.sendNotify(`${$.name}#2`, `${allMessageGp2}`, {
                url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
            }, undefined, TempMessage)
            await $.wait(10 * 1000);
        }
        if ($.isNode() && allMessageGp3) {
            var TempMessage = allMessageGp3;
            if (strAllNotify)
                allMessageGp3 = strAllNotify + `\n` + allMessageGp3;
            await notify.sendNotify(`${$.name}#3`, `${allMessageGp3}`, {
                url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
            }, undefined, TempMessage)
            await $.wait(10 * 1000);
        }
        if ($.isNode() && allMessageGp4) {
            var TempMessage = allMessageGp4;
            if (strAllNotify)
                allMessageGp4 = strAllNotify + `\n` + allMessageGp4;
            await notify.sendNotify(`${$.name}#4`, `${allMessageGp4}`, {
                url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
            }, undefined, TempMessage)
            await $.wait(10 * 1000);
        }
        if ($.isNode() && allMessage) {
            var TempMessage = allMessage;
            if (strAllNotify)
                allMessage = strAllNotify + `\n` + allMessage;

            await notify.sendNotify(`${$.name}`, `${allMessage}`, {
                url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
            }, undefined, TempMessage)
            await $.wait(10 * 1000);
        }

        if ($.isNode() && allMessageMonthGp2) {
            await notify.sendNotify(`京东月资产统计#2`, `${allMessageMonthGp2}`, {
                url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
            })
            await $.wait(10 * 1000);
        }
        if ($.isNode() && allMessageMonthGp3) {
            await notify.sendNotify(`京东月资产统计#3`, `${allMessageMonthGp3}`, {
                url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
            })
            await $.wait(10 * 1000);
        }
        if ($.isNode() && allMessageMonthGp4) {
            await notify.sendNotify(`京东月资产统计#4`, `${allMessageMonthGp4}`, {
                url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
            })
            await $.wait(10 * 1000);
        }
        if ($.isNode() && allMessageMonth) {
            await notify.sendNotify(`京东月资产统计`, `${allMessageMonth}`, {
                url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
            })
            await $.wait(10 * 1000);
        }
    }

    if ($.isNode() && allMessage2Gp2) {
        allMessage2Gp2 += RemainMessage;
        await notify.sendNotify("京东白嫖提醒#2", `${allMessage2Gp2}`, {
            url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
        })
        await $.wait(10 * 1000);
    }
    if ($.isNode() && allMessage2Gp3) {
        allMessage2Gp3 += RemainMessage;
        await notify.sendNotify("京东白嫖提醒#3", `${allMessage2Gp3}`, {
            url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
        })
        await $.wait(10 * 1000);
    }
    if ($.isNode() && allMessage2Gp4) {
        allMessage2Gp4 += RemainMessage;
        await notify.sendNotify("京东白嫖提醒#4", `${allMessage2Gp4}`, {
            url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
        })
        await $.wait(10 * 1000);
    }
    if ($.isNode() && allMessage2) {
        allMessage2 += RemainMessage;
        await notify.sendNotify("京东白嫖提醒", `${allMessage2}`, {
            url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
        })
        await $.wait(10 * 1000);
    }

})()
    .catch((e) => {
        $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
        $.done();
    })
async function showMsg() {
    //if ($.errorMsg)
    //return
    ReturnMessageTitle = "";
    ReturnMessage = "";
    var strsummary = "";
    if (MessageUserGp2) {
        userIndex2 = MessageUserGp2.findIndex((item) => item === $.pt_pin);
    }
    if (MessageUserGp3) {
        userIndex3 = MessageUserGp3.findIndex((item) => item === $.pt_pin);
    }
    if (MessageUserGp4) {
        userIndex4 = MessageUserGp4.findIndex((item) => item === $.pt_pin);
    }

    if (userIndex2 != -1) {
        IndexGp2 += 1;
        ReturnMessageTitle = `【账号${IndexGp2}🆔】${$.nickName || $.UserName}`;
    }
    if (userIndex3 != -1) {
        IndexGp3 += 1;
        ReturnMessageTitle = `【账号${IndexGp3}🆔】${$.nickName || $.UserName}`;
    }
    if (userIndex4 != -1) {
        IndexGp4 += 1;
        ReturnMessageTitle = `【账号${IndexGp4}🆔】${$.nickName || $.UserName}`;
    }
    if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
        IndexAll += 1;
        ReturnMessageTitle = `【账号${IndexAll}🆔】${$.nickName || $.UserName}`;
    }


    if ($.JingXiang) {
        if ($.isRealNameAuth)
            if (cookie.includes("app_open"))
                ReturnMessageTitle += `(wskey已实名)\n`;
            else
                ReturnMessageTitle += `(已实名)\n`;
        else
            if (cookie.includes("app_open"))
                ReturnMessageTitle += `(wskey未实名)\n`;
            else
                ReturnMessageTitle += `(未实名)\n`;

        ReturnMessage += `【账号信息】`;
        if ($.isPlusVip) {
            ReturnMessage += `Plus会员`;
        } else {
            ReturnMessage += `普通会员`;
        }
        if ($.PlustotalScore)
            ReturnMessage += `(${$.PlustotalScore}分)`

        ReturnMessage += `,京享值${$.JingXiang}\n`;
    } else {
        ReturnMessageTitle += `\n`;
    }
    if (llShowMonth) {
        ReturnMessageMonth = ReturnMessage;
        ReturnMessageMonth += `\n【上月收入】：${$.allincomeBean}京豆 🐶\n`;
        ReturnMessageMonth += `【上月支出】：${$.allexpenseBean}京豆 🐶\n`;

        console.log(ReturnMessageMonth);

        if (userIndex2 != -1) {
            allMessageMonthGp2 += ReturnMessageMonth + `\n`;
        }
        if (userIndex3 != -1) {
            allMessageMonthGp3 += ReturnMessageMonth + `\n`;
        }
        if (userIndex4 != -1) {
            allMessageMonthGp4 += ReturnMessageMonth + `\n`;
        }
        if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
            allMessageMonth += ReturnMessageMonth + `\n`;
        }
        if ($.isNode() && WP_APP_TOKEN_ONE) {
            try {
                await notify.sendNotifybyWxPucher("京东月资产统计", `${ReturnMessageMonth}`, `${$.UserName}`);
            } catch {
                $.log(`一对一推送异常，请拷贝库里的sendnotify.js文件到deps目录下，在拉库重试！！！\n`);
            }
        }

    }
    if (EnableCheckBean) {
        if (checkbeanDetailMode == 0) {
            ReturnMessage += `【今日京豆】收${$.todayIncomeBean}豆`;
            strsummary += `收${$.todayIncomeBean}豆,`;
            if ($.todayOutcomeBean != 0) {
                ReturnMessage += `,支${$.todayOutcomeBean}豆`;
            }
            ReturnMessage += `\n`;
            ReturnMessage += `【昨日京豆】收${$.incomeBean}豆`;

            if ($.expenseBean != 0) {
                ReturnMessage += `,支${$.expenseBean}豆`;
            }
            ReturnMessage += `\n`;
        } else {
            if (TempBeanCache) {
                ReturnMessage += `【京豆变动】${$.beanCount - $.beanCache}豆(与${matchtitle}${$.CheckTime}比较)`;
                strsummary += `变动${$.beanCount - $.beanCache}豆,`;
                ReturnMessage += `\n`;
            }
            else {
                ReturnMessage += `【京豆变动】未找到缓存,下次出结果统计`;
                ReturnMessage += `\n`;
            }
        }
    }


    if ($.beanCount) {
        ReturnMessage += `【当前京豆】${$.beanCount - $.beanChangeXi}豆(≈${(($.beanCount - $.beanChangeXi) / 100).toFixed(2)}元)\n`;
    } else {
        if ($.levelName || $.JingXiang)
            ReturnMessage += `【当前京豆】获取失败,接口返回空数据\n`;
        else {
            ReturnMessage += `【当前京豆】${$.beanCount - $.beanChangeXi}豆(≈${(($.beanCount - $.beanChangeXi) / 100).toFixed(2)}元)\n`;
        }
    }

    if ($.JDtotalcash) {
        ReturnMessage += `【特价金币】${$.JDtotalcash}币(≈${($.JDtotalcash / 10000).toFixed(2)}元)\n`;
    }
    if ($.ECardinfo)
        ReturnMessage += `【礼品卡额】${$.ECardinfo}元\n`;

    if ($.JoyRunningAmount)
        ReturnMessage += `【汪汪赛跑】${$.JoyRunningAmount}元\n`;

    if ($.JdFarmProdName != "") {
        if ($.JdtreeEnergy != 0) {
            if ($.treeState === 2 || $.treeState === 3) {
                ReturnMessage += `【老农场】${$.JdFarmProdName} 可以兑换了!\n`;
                TempBaipiao += `【老农场】${$.JdFarmProdName} 可以兑换了!\n`;
                if (userIndex2 != -1) {
                    ReceiveMessageGp2 += `【账号${IndexGp2} ${$.nickName || $.UserName}】${$.JdFarmProdName} (老农场)\n`;
                }
                if (userIndex3 != -1) {
                    ReceiveMessageGp3 += `【账号${IndexGp3} ${$.nickName || $.UserName}】${$.JdFarmProdName} (老农场)\n`;
                }
                if (userIndex4 != -1) {
                    ReceiveMessageGp4 += `【账号${IndexGp4} ${$.nickName || $.UserName}】${$.JdFarmProdName} (老农场)\n`;
                }
                if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
                    allReceiveMessage += `【账号${IndexAll} ${$.nickName || $.UserName}】${$.JdFarmProdName} (老农场)\n`;
                }
            } else {
                //if ($.JdwaterD != 'Infinity' && $.JdwaterD != '-Infinity') {
                //ReturnMessage += `【老农场】${$.JdFarmProdName}(${(($.JdtreeEnergy / $.JdtreeTotalEnergy) * 100).toFixed(0)}%,${$.JdwaterD}天)\n`;
                //} else {
                ReturnMessage += `【老农场】${$.JdFarmProdName}(${(($.JdtreeEnergy / $.JdtreeTotalEnergy) * 100).toFixed(0)}%)\n`;

                //}
            }
        } else {
            if ($.treeState === 0) {
                TempBaipiao += `【老农场】水果领取后未重新种植!\n`;

                if (userIndex2 != -1) {
                    WarnMessageGp2 += `【账号${IndexGp2} ${$.nickName || $.UserName}】水果领取后未重新种植! (老农场)\n`;
                }
                if (userIndex3 != -1) {
                    WarnMessageGp3 += `【账号${IndexGp3} ${$.nickName || $.UserName}】水果领取后未重新种植! (老农场)\n`;
                }
                if (userIndex4 != -1) {
                    WarnMessageGp4 += `【账号${IndexGp4} ${$.nickName || $.UserName}】水果领取后未重新种植! (老农场)\n`;
                }
                if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
                    allWarnMessage += `【账号${IndexAll} ${$.nickName || $.UserName}】水果领取后未重新种植! (老农场)\n`;
                }

            } else if ($.treeState === 1) {
                ReturnMessage += `【老农场】${$.JdFarmProdName}种植中...\n`;
            } else {
                TempBaipiao += `【老农场】状态异常!\n`;
                if (userIndex2 != -1) {
                    WarnMessageGp2 += `【账号${IndexGp2} ${$.nickName || $.UserName}】状态异常! (老农场)\n`;
                }
                if (userIndex3 != -1) {
                    WarnMessageGp3 += `【账号${IndexGp3} ${$.nickName || $.UserName}】状态异常! (老农场)\n`;
                }
                if (userIndex4 != -1) {
                    WarnMessageGp4 += `【账号${IndexGp4} ${$.nickName || $.UserName}】状态异常! (老农场)\n`;
                }
                if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
                    allWarnMessage += `【账号${IndexAll} ${$.nickName || $.UserName}】状态异常! (老农场)\n`;
                }
                //ReturnMessage += `【老农场】${$.JdFarmProdName}状态异常${$.treeState}...\n`;
            }
        }
    }
    if ($.fruitnewinfo){
        //ReturnMessage += `【新农场】种植进度${$.fruitnewinfo}\n`;
        if ($.fruitnewinfo.skuName && $.fruitnewinfo.treeFullStage == 5 ){
            ReturnMessage += `【新农场】种植完成!\n`;
            TempBaipiao += `【新农场】种植完成!\n`;
            allReceiveMessage += `【账号${IndexAll} ${$.nickName || $.UserName}】种植完成，去领取吧 (新农场)\n`;
        } else if ($.fruitnewinfo.skuName && $.fruitnewinfo.treeCurrentState === 0){
            ReturnMessage += '【新农场】种植进度' + $.fruitnewinfo.treeFullStage +'/5(' + $.fruitnewinfo.currentProcess+'%)\n';
        } else if ($.fruitnewinfo.treeFullStage === 0){
            ReturnMessage += `【新农场】未种植!\n`;
            //TempBaipiao += `【新农场】未种植!\n`;
            //allWarnMessage += `【账号${IndexAll} ${$.nickName || $.UserName}】未种植，快去种植吧! (新农场)\n`;
        } else {
            ReturnMessage += '【新农场】可能枯萎了，请重新种植！\n';
        }
    } 
    if ($.newfarm_info){
            //ReturnMessage += `【新农场】奖品未兑换!\n`;
            TempBaipiao += `【新农场】奖品未兑换!\n`;
            allReceiveMessage += `【账号${IndexAll} ${$.nickName || $.UserName}】\n ${$.newfarm_info}\n 快去兑换吧 (新农场)\n`;        
    }

    let dwscore = await dwappinfo();
    if (dwscore) {
        let dwappex = await dwappexpire();
        ReturnMessage += `【话费积分】${dwscore}`;
        if (dwappex) {
            ReturnMessage += `(近7日将过期${dwappex})`;
        }
        ReturnMessage += `\n`;
    }
    let marketcard = await marketCard();
    if (marketcard && marketcard.balance != '0.00' ) {
        ReturnMessage += `【超市卡】${marketcard.balance}元`;
        if (marketcard.expirationGiftAmountDes) {
            ReturnMessage += `(${marketcard.expirationGiftAmountDes})`;
        }
        ReturnMessage += `\n`;
    }

    if ($.jdCash) {
        ReturnMessage += `【其他信息】`;

        if ($.jdCash) {
            ReturnMessage += `领现金:${$.jdCash}元`;
        }

        ReturnMessage += `\n`;

    }

    if (strGuoqi) {
        ReturnMessage += `💸💸💸临期京豆明细💸💸💸\n`;
        ReturnMessage += `${strGuoqi}`;
    }

    ReturnMessage += `🧧🧧🧧红包明细🧧🧧🧧\n`;
    ReturnMessage += `${$.message}`;
    strsummary += `红包${$.balance}元`
    if ($.YunFeiQuan) {
        var strTempYF = "【免运费券】" + $.YunFeiQuan + "张";
        if ($.YunFeiQuanEndTime)
            strTempYF += "(有效期至" + $.YunFeiQuanEndTime + ")";
        strTempYF += "\n";
        ReturnMessage += strTempYF
    }
    if ($.YunFeiQuan2) {
        var strTempYF2 = "【免运费券】" + $.YunFeiQuan2 + "张";
        if ($.YunFeiQuanEndTime2)
            strTempYF += "(有效期至" + $.YunFeiQuanEndTime2 + ")";
        strTempYF2 += "\n";
        ReturnMessage += strTempYF2
    }

    if (userIndex2 != -1) {
        allMessageGp2 += ReturnMessageTitle + ReturnMessage + `\n`;
    }
    if (userIndex3 != -1) {
        allMessageGp3 += ReturnMessageTitle + ReturnMessage + `\n`;
    }
    if (userIndex4 != -1) {
        allMessageGp4 += ReturnMessageTitle + ReturnMessage + `\n`;
    }
    if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
        allMessage += ReturnMessageTitle + ReturnMessage + `\n------\n`;
    }

    console.log(`${ReturnMessageTitle + ReturnMessage}`);

    if ($.isNode() && WP_APP_TOKEN_ONE) {
        var strTitle = "京东资产统计";
        if ($.JingXiang) {
            if ($.isRealNameAuth)
                if (cookie.includes("app_open"))
                    ReturnMessage = `【账号名称】${$.nickName || $.UserName}(wskey已实名)\n` + ReturnMessage;
                else
                    ReturnMessage = `【账号名称】${$.nickName || $.UserName}(已实名)\n` + ReturnMessage;
            else
                if (cookie.includes("app_open"))
                    ReturnMessage = `【账号名称】${$.nickName || $.UserName}(wskey未实名)\n` + ReturnMessage;
                else
                    ReturnMessage = `【账号名称】${$.nickName || $.UserName}(未实名)\n` + ReturnMessage;

        } else {
            ReturnMessage = `【账号名称】${$.nickName || $.UserName}\n` + ReturnMessage;
        }
        if (TempBaipiao) {
            TempBaipiao = `【⏰商品白嫖活动提醒⏰】\n` + TempBaipiao;
            ReturnMessage = TempBaipiao + `\n` + ReturnMessage;
        }

        ReturnMessage += RemainMessage;

        if (strAllNotify)
            ReturnMessage = strAllNotify + `\n` + ReturnMessage;
        try {
            await notify.sendNotifybyWxPucher(strTitle, `${ReturnMessage}`, `${$.UserName}`, undefined, strsummary);
        } catch {
            $.log(`一对一推送异常，请拷贝库里的sendnotify.js文件到deps目录下，在拉库重试！！！\n`);
        }
    }

    //$.msg($.name, '', ReturnMessage , {"open-url": "https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean"});
}
async function bean() {

    if (EnableCheckBean && checkbeanDetailMode == 0) {

        // console.log(`北京时间零点时间戳:${parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000}`);
        // console.log(`北京时间2020-10-28 06:16:05::${new Date("2020/10/28 06:16:05+08:00").getTime()}`)
        // 不管哪个时区。得到都是当前时刻北京时间的时间戳 new Date().getTime() + new Date().getTimezoneOffset()*60*1000 + 8*60*60*1000

        //前一天的0:0:0时间戳
        const tm = parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000 - (24 * 60 * 60 * 1000);
        // 今天0:0:0时间戳
        const tm1 = parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000;
        let page = 1,
            t = 0,
            yesterdayArr = [],
            todayArr = [];
        do {
            let response = await getJingBeanBalanceDetail(page);
            await $.wait(1000);
            // console.log(`第${page}页: ${JSON.stringify(response)}`);
            if (response && response.code === "0") {
                page++;
                let detailList = response.jingDetailList;
                if (detailList && detailList.length > 0) {
                    for (let item of detailList) {
                        const date = item.date.replace(/-/g, '/') + "+08:00";
                        if (new Date(date).getTime() >= tm1 && (!item['eventMassage'].includes("退还") && !item['eventMassage'].includes("物流") && !item['eventMassage'].includes('扣赠'))) {
                            todayArr.push(item);
                        } else if (tm <= new Date(date).getTime() && new Date(date).getTime() < tm1 && (!item['eventMassage'].includes("退还") && !item['eventMassage'].includes("物流") && !item['eventMassage'].includes('扣赠'))) {
                            //昨日的
                            yesterdayArr.push(item);
                        } else if (tm > new Date(date).getTime()) {
                            //前天的
                            t = 1;
                            break;
                        }
                    }
                } else {
                    $.errorMsg = `数据异常`;
                    $.msg($.name, ``, `账号${$.index}：${$.nickName}\n${$.errorMsg}`);
                    t = 1;
                }
            } else if (response && response.code === "3") {
                console.log(`cookie已过期，或者填写不规范，跳出`)
                t = 1;
            } else {
                console.log(`未知情况：${JSON.stringify(response)}`);
                console.log(`未知情况，跳出`)
                t = 1;
            }
        } while (t === 0);
        for (let item of yesterdayArr) {
            if (Number(item.amount) > 0) {
                $.incomeBean += Number(item.amount);
            } else if (Number(item.amount) < 0) {
                $.expenseBean += Number(item.amount);
            }
        }
        for (let item of todayArr) {
            if (Number(item.amount) > 0) {
                $.todayIncomeBean += Number(item.amount);
            } else if (Number(item.amount) < 0) {
                $.todayOutcomeBean += Number(item.amount);
            }
        }
        $.todayOutcomeBean = -$.todayOutcomeBean;
        $.expenseBean = -$.expenseBean;
    }

    if (EnableOverBean) {
        await jingBeanDetail(); //过期京豆	    
    }
    await redPacket();
    if (EnableChaQuan)
        await getCoupon();
}

async function Monthbean() {
    let time = new Date();
    let year = time.getFullYear();
    let month = parseInt(time.getMonth()); //取上个月
    if (month == 0) {
        //一月份，取去年12月，所以月份=12，年份减1
        month = 12;
        year -= 1;
    }

    //开始时间 时间戳
    let start = new Date(year + "-" + month + "-01 00:00:00").getTime();
    console.log(`计算月京豆起始日期:` + GetDateTime(new Date(year + "-" + month + "-01 00:00:00")));

    //结束时间 时间戳
    if (month == 12) {
        //取去年12月，进1个月，所以月份=1，年份加1
        month = 1;
        year += 1;
    }
    let end = new Date(year + "-" + (month + 1) + "-01 00:00:00").getTime();
    console.log(`计算月京豆结束日期:` + GetDateTime(new Date(year + "-" + (month + 1) + "-01 00:00:00")));

    let allpage = 1,
        allt = 0,
        allyesterdayArr = [];
    do {
        let response = await getJingBeanBalanceDetail(allpage);
        await $.wait(1000);
        // console.log(`第${allpage}页: ${JSON.stringify(response)}`);
        if (response && response.code === "0") {
            allpage++;
            let detailList = response.jingDetailList;
            if (detailList && detailList.length > 0) {
                for (let item of detailList) {
                    const date = item.date.replace(/-/g, '/') + "+08:00";
                    if (start <= new Date(date).getTime() && new Date(date).getTime() < end) {
                        //日期区间内的京豆记录
                        allyesterdayArr.push(item);
                    } else if (start > new Date(date).getTime()) {
                        //前天的
                        allt = 1;
                        break;
                    }
                }
            } else {
                $.errorMsg = `数据异常`;
                $.msg($.name, ``, `账号${$.index}：${$.nickName}\n${$.errorMsg}`);
                allt = 1;
            }
        } else if (response && response.code === "3") {
            console.log(`cookie已过期，或者填写不规范，跳出`)
            allt = 1;
        } else {
            console.log(`未知情况：${JSON.stringify(response)}`);
            console.log(`未知情况，跳出`)
            allt = 1;
        }
    } while (allt === 0);

    for (let item of allyesterdayArr) {
        if (Number(item.amount) > 0) {
            $.allincomeBean += Number(item.amount);
        } else if (Number(item.amount) < 0) {
            $.allexpenseBean += Number(item.amount);
        }
    }

}

async function jdCash() {
    if (!EnableCash)
        return;
    let opt = {
        url: `https://api.m.jd.com`,
        body: `functionId=cash_exchange_center&body={"version":"1","channel":"app"}&appid=signed_wh5&client=android&clientVersion=11.8.0&t=${Date.now()}`,
        headers: {
            'Host': 'api.m.jd.com',
            'Origin': 'https://h5.m.jd.com',
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': $.UA,
            'Cookie': cookie
        }
    }
    return new Promise((resolve) => {
        $.post(opt, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`jdCash API请求失败，请检查网路重试`)
                } else {
                    if (safeGet(data)) {
                        data = JSON.parse(data)
                        if (data.code == 0) {
                            if (data.data.bizCode == 0) {
                                $.jdCash = data.data.result.userMoney;
                            } else {
                                //console.log(data.data.bizMsg);
                            }
                        } else {
                            //console.log(data.msg)
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            }
            finally {
                resolve(data);
            }
        })
    })
}

function apptaskUrl(functionId = "", body = "") {
    return {
        url: `${JD_API_HOST}?functionId=${functionId}`,
        body,
        headers: {
            'Cookie': cookie,
            'Host': 'api.m.jd.com',
            'Connection': 'keep-alive',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': '',
            'User-Agent': 'JD4iPhone/167774 (iPhone; iOS 14.7.1; Scale/3.00)',
            'Accept-Language': 'zh-Hans-CN;q=1',
            'Accept-Encoding': 'gzip, deflate, br',
        },
        timeout: 10000
    }
}

function TotalBean() {
    return new Promise(async resolve => {
        const options = {
            "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
            "headers": {
                "Accept": "application/json,text/plain, */*",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "zh-cn",
                "Connection": "keep-alive",
                "Cookie": cookie,
                "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
                "User-Agent": $.UA
            }
        }
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        if (data['retcode'] === 13) {
                            $.isLogin = false; //cookie过期
                            return
                        }
                        if (data['retcode'] === 0) {
                            $.nickName = (data['base'] && data['base'].nickname) || $.UserName;
                            //$.isPlusVip=data['isPlusVip'];
                            $.isRealNameAuth = data['isRealNameAuth'];
                            $.beanCount = (data['base'] && data['base'].jdNum) || 0;
                            $.JingXiang = (data['base'] && data['base'].jvalue) || 0;
                        } else {
                            $.nickName = $.UserName
                        }



                    } else {
                        console.log(`京东服务器返回空数据`)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function TotalBean2() {
    return new Promise(async (resolve) => {
        const options = {
            url: `https://wxapp.m.jd.com/kwxhome/myJd/home.json?&useGuideModule=0&bizId=&brandId=&fromType=wxapp&timestamp=${Date.now()}`,
            headers: {
                Cookie: cookie,
                'content-type': `application/x-www-form-urlencoded`,
                Connection: `keep-alive`,
                'Accept-Encoding': `gzip,compress,br,deflate`,
                Referer: `https://servicewechat.com/wxa5bf5ee667d91626/161/page-frame.html`,
                Host: `wxapp.m.jd.com`,
                'User-Agent': `Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.10(0x18000a2a) NetType/WIFI Language/zh_CN`,
            },
            timeout: 10000
        };
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    $.logErr(err);
                } else {
                    if (data) {
                        data = JSON.parse(data);

                        if (!data.user) {
                            return;
                        }
                        const userInfo = data.user;
                        if (userInfo) {
                            if (!$.nickName)
                                $.nickName = userInfo.petName;
                            if ($.beanCount == 0) {
                                $.beanCount = userInfo.jingBean;
                            }
                            $.JingXiang = userInfo.uclass;
                        }
                    } else {
                        $.log('京东服务器返回空数据');
                    }
                }
            } catch (e) {
                $.logErr(e);
            }
            finally {
                resolve();
            }
        });
    });
}

function isLoginByX1a0He() {
    return new Promise((resolve) => {
        const options = {
            url: 'https://plogin.m.jd.com/cgi-bin/ml/islogin',
            headers: {
                "Cookie": cookie,
                "referer": "https://h5.m.jd.com/",
                "User-Agent": "jdapp;iPhone;10.1.2;15.0;network/wifi;Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
            },
            timeout: 10000
        }
        $.get(options, (err, resp, data) => {
            try {
                if (data) {
                    data = JSON.parse(data);
                    if (data.islogin === "1") {
                        console.log(`使用X1a0He写的接口加强检测: Cookie有效\n`)
                    } else if (data.islogin === "0") {
                        $.isLogin = false;
                        console.log(`使用X1a0He写的接口加强检测: Cookie无效\n`)
                    } else {
                        console.log(`使用X1a0He写的接口加强检测: 未知返回，不作变更...\n`)
                        $.error = `${$.nickName} :` + `使用X1a0He写的接口加强检测: 未知返回...\n`
                    }
                }
            } catch (e) {
                console.log(e);
            }
            finally {
                resolve();
            }
        });
    });
}

function getJingBeanBalanceDetail(page) {
    return new Promise(async resolve => {
        const options = {
            "url": `https://bean.m.jd.com/beanDetail/detail.json?page=${page}`,
            "body": `body=${escape(JSON.stringify({ "pageSize": "20", "page": page.toString() }))}&appid=ld`,
            "headers": {
                'User-Agent': $.UA,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookie,
            }
        }
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`getJingBeanBalanceDetail API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        // console.log(data)
                    } else {
                        // console.log(`京东服务器返回空数据`)
                    }
                }
            } catch (e) {
                // $.logErr(e, resp)
            } finally {
                resolve(data);
            }
        })
    })
}

function jingBeanDetail() {
    return new Promise(async resolve => {
        setTimeout(async () => {
            var strsign = "";
            if (epsignurl) {
                strsign = await getepsign('jingBeanDetail', { "pageSize": "20", "page": "1" });
                strsign = strsign.body;
            }
            else
                strsign = await getSignfromNolan('jingBeanDetail', { "pageSize": "20", "page": "1" });

            const options = {
                "url": `https://api.m.jd.com/client.action?functionId=jingBeanDetail`,
                "body": strsign,
                "headers": {
                    'User-Agent': $.UA,
                    'Host': 'api.m.jd.com',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': cookie,
                }
            }
            $.post(options, (err, resp, data) => {
                try {
                    if (err) {
                        console.log(`${JSON.stringify(err)}`)
                        console.log(`${$.name} jingBeanDetail API请求失败，请检查网路重试`)
                    } else {
                        if (data) {
                            data = JSON.parse(data);
                            if (data?.others?.jingBeanExpiringInfo?.detailList) {
                                const { detailList = [] } = data?.others?.jingBeanExpiringInfo;
                                detailList.map(item => {
                                    strGuoqi += `【${(item['eventMassage']).replace("即将过期京豆", "").replace("年", "-").replace("月", "-").replace("日", "")}】过期${item['amount']}豆\n`;
                                })
                            }
                        } else {
                            console.log(`jingBeanDetail 京东服务器返回空数据`)
                        }
                    }
                } catch (e) {
                    if (epsignurl)
                        $.logErr(e, resp)
                    else
                        console.log("因为没有指定带ep的Sign,获取过期豆子信息次数多了就会失败.")
                } finally {
                    resolve(data);
                }
            })
        }, 0 * 1000);
    })
}

function getepsign(n, o, t = "sign") {
    let e = {
        url: epsignurl,
        form: {
            functionId: n, body: $.toStr(o),
        }, headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };
    return new Promise(n => {
        $.post(e, async (o, t, e) => {
            try {
                o ? console.log(o) : e = JSON.parse(e)
                if (e.code === 200 && e.data) {
                    n({ body: e.data.convertUrlNew })
                }
            } catch (n) {
                $.logErr(n, t)
            } finally {
                n({ body: e.convertUrlNew })
            }
        })
    })
}

function getSignfromNolan(functionId, body) {
    var strsign = '';
    let data = {
        "fn": functionId,
        "body": body
    }
    return new Promise((resolve) => {
        let url = {
            url: jdSignUrl,
            body: JSON.stringify(data),
            followRedirect: false,
            headers: {
                'Accept': '*/*',
                "accept-encoding": "gzip, deflate, br",
                'Content-Type': 'application/json'
            },
            timeout: 30000
        }
        $.post(url, async (err, resp, data) => {
            try {
                data = JSON.parse(data);
                if (data && data.body) {
                    if (data.body)
                        strsign = data.body || '';
                    if (strsign != '')
                        resolve(strsign);
                    else
                        console.log("签名获取失败.");
                } else {
                    console.log("签名获取失败.");
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve(strsign);
            }
        })
    })
}


function redPacket() {
    return new Promise(async resolve => {
        const options = {
            "url": `https://api.m.jd.com/client.action?functionId=myhongbao_getUsableHongBaoList&body=%7B%22appId%22%3A%22appHongBao%22%2C%22appToken%22%3A%22apphongbao_token%22%2C%22platformId%22%3A%22appHongBao%22%2C%22platformToken%22%3A%22apphongbao_token%22%2C%22platform%22%3A%221%22%2C%22orgType%22%3A%222%22%2C%22country%22%3A%22cn%22%2C%22childActivityId%22%3A%22-1%22%2C%22childActiveName%22%3A%22-1%22%2C%22childActivityTime%22%3A%22-1%22%2C%22childActivityUrl%22%3A%22-1%22%2C%22openId%22%3A%22-1%22%2C%22activityArea%22%3A%22-1%22%2C%22applicantErp%22%3A%22-1%22%2C%22eid%22%3A%22-1%22%2C%22fp%22%3A%22-1%22%2C%22shshshfp%22%3A%22-1%22%2C%22shshshfpa%22%3A%22-1%22%2C%22shshshfpb%22%3A%22-1%22%2C%22jda%22%3A%22-1%22%2C%22activityType%22%3A%221%22%2C%22isRvc%22%3A%22-1%22%2C%22pageClickKey%22%3A%22-1%22%2C%22extend%22%3A%22-1%22%2C%22organization%22%3A%22JD%22%7D&appid=JDReactMyRedEnvelope&client=apple&clientVersion=7.0.0`,
            "headers": {
                'Host': 'api.m.jd.com',
                'Accept': '*/*',
                'Connection': 'keep-alive',
                'Accept-Language': 'zh-cn',
                'Referer': 'https://h5.m.jd.com/',
                'Accept-Encoding': 'gzip, deflate, br',
                "Cookie": cookie,
                'User-Agent': $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1")
            }
        }
        $.get(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`redPacket API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        $.jxRed = 0,
                            $.jsRed = 0,
                            $.jdRed = 0,
                            $.jdhRed = 0,
                            $.jdwxRed = 0,
                            $.jdGeneralRed = 0,
                            $.jxRedExpire = 0,
                            $.jsRedExpire = 0,
                            $.jdRedExpire = 0,
                            $.jdhRedExpire = 0;
                        $.jdwxRedExpire = 0,
                            $.jdGeneralRedExpire = 0

                        let t = new Date();
                        t.setDate(t.getDate() + 1);
                        t.setHours(0, 0, 0, 0);
                        t = parseInt((t - 1) / 1000) * 1000;

                        for (let vo of data.hongBaoList || []) {
                            if (vo.orgLimitStr) {
                                if (vo.orgLimitStr.includes("京喜") && !vo.orgLimitStr.includes("特价")) {
                                    $.jxRed += parseFloat(vo.balance)
                                    if (vo['endTime'] === t) {
                                        $.jxRedExpire += parseFloat(vo.balance)
                                    }
                                    continue;
                                } else if (vo.orgLimitStr.includes("购物小程序")) {
                                    $.jdwxRed += parseFloat(vo.balance)
                                    if (vo['endTime'] === t) {
                                        $.jdwxRedExpire += parseFloat(vo.balance)
                                    }
                                    continue;
                                } else if (vo.orgLimitStr.includes("京东商城")) {
                                    $.jdRed += parseFloat(vo.balance)
                                    if (vo['endTime'] === t) {
                                        $.jdRedExpire += parseFloat(vo.balance)
                                    }
                                    continue;
                                } else if (vo.orgLimitStr.includes("极速") || vo.orgLimitStr.includes("京东特价") || vo.orgLimitStr.includes("京喜特价")) {
                                    $.jsRed += parseFloat(vo.balance)
                                    if (vo['endTime'] === t) {
                                        $.jsRedExpire += parseFloat(vo.balance)
                                    }
                                    continue;
                                } else if (vo.orgLimitStr && vo.orgLimitStr.includes("京东健康")) {
                                    $.jdhRed += parseFloat(vo.balance)
                                    if (vo['endTime'] === t) {
                                        $.jdhRedExpire += parseFloat(vo.balance)
                                    }
                                    continue;
                                }
                            }
                            $.jdGeneralRed += parseFloat(vo.balance)
                            if (vo['endTime'] === t) {
                                $.jdGeneralRedExpire += parseFloat(vo.balance)
                            }
                        }

                        $.balance = ($.jxRed + $.jsRed + $.jdRed + $.jdhRed + $.jdwxRed + $.jdGeneralRed).toFixed(2);
                        $.jxRed = $.jxRed.toFixed(2);
                        $.jsRed = $.jsRed.toFixed(2);
                        $.jdRed = $.jdRed.toFixed(2);
                        $.jdhRed = $.jdhRed.toFixed(2);
                        $.jdwxRed = $.jdwxRed.toFixed(2);
                        $.jdGeneralRed = $.jdGeneralRed.toFixed(2);
                        $.expiredBalance = ($.jxRedExpire + $.jsRedExpire + $.jdRedExpire + $.jdhRedExpire + $.jdwxRedExpire + $.jdGeneralRedExpire).toFixed(2);
                        $.message += `【红包总额】${$.balance}(总过期${$.expiredBalance})元 \n`;
                        if ($.jxRed > 0) {
                            if ($.jxRedExpire > 0)
                                $.message += `【京喜红包】${$.jxRed}(将过期${$.jxRedExpire.toFixed(2)})元 \n`;
                            else
                                $.message += `【京喜红包】${$.jxRed}元 \n`;
                        }

                        if ($.jsRed > 0) {
                            if ($.jsRedExpire > 0)
                                $.message += `【京喜特价】${$.jsRed}(将过期${$.jsRedExpire.toFixed(2)})元 \n`;
                            else
                                $.message += `【京喜特价】${$.jsRed}元 \n`;
                        }

                        if ($.jdRed > 0) {
                            if ($.jdRedExpire > 0)
                                $.message += `【京东红包】${$.jdRed}(将过期${$.jdRedExpire.toFixed(2)})元 \n`;
                            else
                                $.message += `【京东红包】${$.jdRed}元 \n`;
                        }

                        if ($.jdhRed > 0) {
                            if ($.jdhRedExpire > 0)
                                $.message += `【健康红包】${$.jdhRed}(将过期${$.jdhRedExpire.toFixed(2)})元 \n`;
                            else
                                $.message += `【健康红包】${$.jdhRed}元 \n`;
                        }

                        if ($.jdwxRed > 0) {
                            if ($.jdwxRedExpire > 0)
                                $.message += `【微信小程序】${$.jdwxRed}(将过期${$.jdwxRedExpire.toFixed(2)})元 \n`;
                            else
                                $.message += `【微信小程序】${$.jdwxRed}元 \n`;
                        }

                        if ($.jdGeneralRed > 0) {
                            if ($.jdGeneralRedExpire > 0)
                                $.message += `【全平台通用】${$.jdGeneralRed}(将过期${$.jdGeneralRedExpire.toFixed(2)})元 \n`;
                            else
                                $.message += `【全平台通用】${$.jdGeneralRed}元 \n`;

                        }

                    } else {
                        console.log(`京东服务器返回空数据`)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            }
            finally {
                resolve(data);
            }
        })
    })
}

function getCoupon() {
    return new Promise(resolve => {
        let options = {
            url: `https://wq.jd.com/activeapi/queryjdcouponlistwithfinance?state=1&wxadd=1&filterswitch=1&_=${Date.now()}&sceneval=2&g_login_type=1&callback=jsonpCBKB&g_ty=ls`,
            headers: {
                'authority': 'wq.jd.com',
                "User-Agent": $.UA,
                'accept': '*/*',
                'referer': 'https://wqs.jd.com/',
                'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'cookie': cookie
            },
            timeout: 10000
        }
        $.get(options, async (err, resp, data) => {
            try {
                data = JSON.parse(data.match(new RegExp(/jsonpCBK.?\((.*);*/))[1]);
                let couponTitle = '';
                let couponId = '';
                // 删除可使用且非超市、生鲜、京贴;
                let useable = data.coupon.useable;
                $.todayEndTime = new Date(new Date(new Date().getTime()).setHours(23, 59, 59, 999)).getTime();
                $.tomorrowEndTime = new Date(new Date(new Date().getTime() + 24 * 60 * 60 * 1000).setHours(23, 59, 59, 999)).getTime();
                $.platFormInfo = "";
                for (let i = 0; i < useable.length; i++) {
                    //console.log(useable[i]);
                    if (useable[i].limitStr.indexOf('全品类') > -1) {
                        $.beginTime = useable[i].beginTime;
                        if ($.beginTime < new Date().getTime() && useable[i].quota <= 100 && useable[i].coupontype === 1) {
                            //$.couponEndTime = new Date(parseInt(useable[i].endTime)).Format('yyyy-MM-dd');
                            $.couponName = useable[i].limitStr;
                            if (useable[i].platFormInfo)
                                $.platFormInfo = useable[i].platFormInfo;

                            var decquota = parseFloat(useable[i].quota).toFixed(2);
                            var decdisc = parseFloat(useable[i].discount).toFixed(2);
                            if (useable[i].quota > useable[i].discount + 5 && useable[i].discount < 2)
                                continue
                            $.message += `【全品类券】满${decquota}减${decdisc}元`;

                            if (useable[i].endTime < $.todayEndTime) {
                                $.message += `(今日过期,${$.platFormInfo})\n`;
                            } else if (useable[i].endTime < $.tomorrowEndTime) {
                                $.message += `(明日将过期,${$.platFormInfo})\n`;
                            } else {
                                $.message += `(${$.platFormInfo})\n`;
                            }

                        }
                    }
                    if (useable[i].couponTitle.indexOf('运费券') > -1 && useable[i].limitStr.indexOf('自营商品运费') > -1) {
                        if (!$.YunFeiTitle) {
                            $.YunFeiTitle = useable[i].couponTitle;
                            $.YunFeiQuanEndTime = new Date(parseInt(useable[i].endTime)).Format('yyyy-MM-dd');
                            $.YunFeiQuan += 1;
                        } else {
                            if ($.YunFeiTitle == useable[i].couponTitle) {
                                $.YunFeiQuanEndTime = new Date(parseInt(useable[i].endTime)).Format('yyyy-MM-dd');
                                $.YunFeiQuan += 1;
                            } else {
                                if (!$.YunFeiTitle2)
                                    $.YunFeiTitle2 = useable[i].couponTitle;

                                if ($.YunFeiTitle2 == useable[i].couponTitle) {
                                    $.YunFeiQuanEndTime2 = new Date(parseInt(useable[i].endTime)).Format('yyyy-MM-dd');
                                    $.YunFeiQuan2 += 1;
                                }
                            }

                        }

                    }
                    if (useable[i].couponTitle.indexOf('特价版APP活动') > -1 && useable[i].limitStr == '仅可购买活动商品') {
                        $.beginTime = useable[i].beginTime;
                        if ($.beginTime < new Date().getTime() && useable[i].coupontype === 1) {
                            if (useable[i].platFormInfo)
                                $.platFormInfo = useable[i].platFormInfo;
                            var decquota = parseFloat(useable[i].quota).toFixed(2);
                            var decdisc = parseFloat(useable[i].discount).toFixed(2);

                            $.message += `【特价版券】满${decquota}减${decdisc}元`;

                            if (useable[i].endTime < $.todayEndTime) {
                                $.message += `(今日过期,${$.platFormInfo})\n`;
                            } else if (useable[i].endTime < $.tomorrowEndTime) {
                                $.message += `(明日将过期,${$.platFormInfo})\n`;
                            } else {
                                $.message += `(${$.platFormInfo})\n`;
                            }

                        }

                    }
                    //8是支付券， 7是白条券
                    if (useable[i].couponStyle == 7 || useable[i].couponStyle == 8) {
                        $.beginTime = useable[i].beginTime;
                        if ($.beginTime > new Date().getTime() || useable[i].quota > 50 || useable[i].coupontype != 1) {
                            continue;
                        }

                        if (useable[i].couponStyle == 8) {
                            $.couponType = "支付立减";
                        } else {
                            $.couponType = "白条优惠";
                        }
                        if (useable[i].discount < useable[i].quota)
                            $.message += `【${$.couponType}】满${useable[i].quota}减${useable[i].discount}元`;
                        else
                            $.message += `【${$.couponType}】立减${useable[i].discount}元`;
                        if (useable[i].platFormInfo)
                            $.platFormInfo = useable[i].platFormInfo;

                        //$.couponEndTime = new Date(parseInt(useable[i].endTime)).Format('yyyy-MM-dd');

                        if (useable[i].endTime < $.todayEndTime) {
                            $.message += `(今日过期,${$.platFormInfo})\n`;
                        } else if (useable[i].endTime < $.tomorrowEndTime) {
                            $.message += `(明日将过期,${$.platFormInfo})\n`;
                        } else {
                            $.message += `(${$.platFormInfo})\n`;
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp);
            }
            finally {
                resolve();
            }
        })
    })
}

function jdfruitRequest(function_id, body = {}, timeout = 1000) {
    return new Promise(resolve => {
        setTimeout(() => {
            $.get(taskfruitUrl(function_id, body), (err, resp, data) => {
                try {
                    if (err) {
                        console.log('\n老农场: API查询请求失败 ‼️‼️')
                        console.log(JSON.stringify(err));
                        console.log(`function_id:${function_id}`)
                        $.logErr(err);
                    } else {
                        if (safeGet(data)) {
                            data = JSON.parse(data);
                            if (data.code == "400") {
                                console.log('老农场: ' + data.message);
                                llgeterror = true;
                            }
                            else
                                $.JDwaterEveryDayT = data.firstWaterInit.totalWaterTimes;
                        }
                    }
                } catch (e) {
                    $.logErr(e, resp);
                }
                finally {
                    resolve(data);
                }
            })
        }, timeout)
    })
}

async function getjdfruitinfo() {
    if (EnableJdFruit) {
        llgeterror = false;

        //await jdfruitRequest('taskInitForFarm', {
        //    "version": 14,
        //    "channel": 1,
        //    "babelChannel": "120"
        //});
        //
        //if (llgeterror)
        //	return
        //
        await fruitinfo();
        if (llgeterror) {
            console.log(`老农场API查询失败,等待10秒后再次尝试...`)
            await $.wait(10 * 1000);
            await fruitinfo();
        }
        if (llgeterror) {
            console.log(`老农场API查询失败,有空重启路由器换个IP吧.`)
        }

    }
    return;
}

async function getjdfruit() {
    return new Promise(resolve => {
        const option = {
            url: `${JD_API_HOST}?functionId=initForFarm`,
            body: `body=${escape(JSON.stringify({ "version": 4 }))}&appid=wh5&clientVersion=9.1.0`,
            headers: {
                "accept": "*/*",
                "accept-encoding": "gzip, deflate, br",
                "accept-language": "zh-CN,zh;q=0.9",
                "cache-control": "no-cache",
                "cookie": cookie,
                "origin": "https://home.m.jd.com",
                "pragma": "no-cache",
                "referer": "https://home.m.jd.com/myJd/newhome.action",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
                "Content-Type": "application/x-www-form-urlencoded"
            },
            timeout: 10000
        };
        $.post(option, (err, resp, data) => {
            try {
                if (err) {
                    if (!llgeterror) {
                        console.log('\n老农场: API查询请求失败 ‼️‼️');
                        console.log(JSON.stringify(err));
                    }
                    llgeterror = true;
                } else {
                    llgeterror = false;
                    if (safeGet(data)) {
                        $.farmInfo = JSON.parse(data)
                        if ($.farmInfo.farmUserPro) {
                            $.JdFarmProdName = $.farmInfo.farmUserPro.name;
                            $.JdtreeEnergy = $.farmInfo.farmUserPro.treeEnergy;
                            $.JdtreeTotalEnergy = $.farmInfo.farmUserPro.treeTotalEnergy;
                            $.treeState = $.farmInfo.treeState;
                            let waterEveryDayT = $.JDwaterEveryDayT;
                            let waterTotalT = ($.farmInfo.farmUserPro.treeTotalEnergy - $.farmInfo.farmUserPro.treeEnergy) / 10; //一共还需浇多少次水
                            let waterD = Math.ceil(waterTotalT / waterEveryDayT);

                            $.JdwaterTotalT = waterTotalT;
                            $.JdwaterD = waterD;
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            }
            finally {
                resolve();
            }
        })
    })
}

function taskfruitUrl(function_id, body = {}) {
    return {
        url: `${JD_API_HOST}?functionId=${function_id}&body=${encodeURIComponent(JSON.stringify(body))}&appid=wh5`,
        headers: {
            "Host": "api.m.jd.com",
            "Accept": "*/*",
            "Origin": "https://carry.m.jd.com",
            "Accept-Encoding": "gzip, deflate, br",
            "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
            "Accept-Language": "zh-CN,zh-Hans;q=0.9",
            "Referer": "https://carry.m.jd.com/",
            "Cookie": cookie
        },
        timeout: 10000
    }
}

function safeGet(data) {
    try {
        if (typeof JSON.parse(data) == "object") {
            return true;
        }
    } catch (e) {
        console.log(e);
        console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
        return false;
    }
}

function cash() {
    if (!EnableJdSpeed)
        return;
    return new Promise(resolve => {
        $.get(taskcashUrl('MyAssetsService.execute', {
            "method": "userCashRecord",
            "data": {
                "channel": 1,
                "pageNum": 1,
                "pageSize": 20
            }
        }),
            async (err, resp, data) => {
                try {
                    if (err) {
                        console.log(`${JSON.stringify(err)}`)
                        console.log(`cash API请求失败，请检查网路重试`)
                    } else {
                        if (safeGet(data)) {
                            data = JSON.parse(data);
                            if (data.data.goldBalance)
                                $.JDtotalcash = data.data.goldBalance;
                            else
                                console.log(`领现金查询失败，服务器没有返回具体值.`)
                        }
                    }
                } catch (e) {
                    $.logErr(e, resp)
                }
                finally {
                    resolve(data);
                }
            })
    })
}

function taskcashUrl(functionId, body = {}) {
    const struuid = randomString(16);
    let nowTime = Date.now();
    let _0x7683x5 = `${"lite-android&"}${JSON["stringify"](body)}${"&android&3.1.0&"}${functionId}&${nowTime}&${struuid}`;
    let _0x7683x6 = "12aea658f76e453faf803d15c40a72e0";
    const _0x7683x7 = $["isNode"]() ? require("crypto-js") : CryptoJS;
    let sign = _0x7683x7.HmacSHA256(_0x7683x5, _0x7683x6).toString();
    let strurl = JD_API_HOST + "api?functionId=" + functionId + "&body=" + `${escape(JSON["stringify"](body))}&appid=lite-android&client=android&uuid=` + struuid + `&clientVersion=3.1.0&t=${nowTime}&sign=${sign}`;
    return {
        url: strurl,
        headers: {
            'Host': "api.m.jd.com",
            'accept': "*/*",
            'kernelplatform': "RN",
            'user-agent': "JDMobileLite/3.1.0 (iPad; iOS 14.4; Scale/2.00)",
            'accept-language': "zh-Hans-CN;q=1, ja-CN;q=0.9",
            'Cookie': cookie
        },
        timeout: 10000
    }
}

function GetJoyRuninginfo() {
    if (!EnableJoyRun)
        return;

    const headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        "Connection": "keep-alive",
        "Content-Length": "376",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": cookie,
        "Host": "api.m.jd.com",
        "Origin": "https://h5platform.jd.com",
        "Referer": "https://h5platform.jd.com/",
        "User-Agent": `jdpingou;iPhone;4.13.0;14.4.2;${randomString(40)};network/wifi;model/iPhone10,2;appBuild/100609;ADID/00000000-0000-0000-0000-000000000000;supportApplePay/1;hasUPPay/0;pushNoticeIsOpen/1;hasOCPay/0;supportBestPay/0;session/${Math.random * 98 + 1};pap/JA2019_3111789;brand/apple;supportJDSHWK/1;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148`
    }
    var DateToday = new Date();
    const body = {
        'linkId': 'L-sOanK_5RJCz7I314FpnQ',
        'isFromJoyPark': true,
        'joyLinkId': 'LsQNxL7iWDlXUs6cFl-AAg'
    };
    const options = {
        url: `https://api.m.jd.com/?functionId=runningPageHome&body=${encodeURIComponent(JSON.stringify(body))}&t=${DateToday.getTime()}&appid=activities_platform&client=ios&clientVersion=3.9.2`,
        headers,
    }
    return new Promise(resolve => {
        $.get(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`GetJoyRuninginfo API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        //console.log(data);
                        data = JSON.parse(data);
                        if (data.data.runningHomeInfo.prizeValue) {
                            $.JoyRunningAmount = data.data.runningHomeInfo.prizeValue * 1;
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            }
            finally {
                resolve(data)
            }
        })
    })
}

function randomString(e) {
    e = e || 32;
    let t = "0123456789abcdef",
        a = t.length,
        n = "";
    for (let i = 0; i < e; i++)
        n += t.charAt(Math.floor(Math.random() * a));
    return n
}

Date.prototype.Format = function (fmt) {
    var e,
        n = this,
        d = fmt,
        l = {
            "M+": n.getMonth() + 1,
            "d+": n.getDate(),
            "D+": n.getDate(),
            "h+": n.getHours(),
            "H+": n.getHours(),
            "m+": n.getMinutes(),
            "s+": n.getSeconds(),
            "w+": n.getDay(),
            "q+": Math.floor((n.getMonth() + 3) / 3),
            "S+": n.getMilliseconds()
        };
    /(y+)/i.test(d) && (d = d.replace(RegExp.$1, "".concat(n.getFullYear()).substr(4 - RegExp.$1.length)));
    for (var k in l) {
        if (new RegExp("(".concat(k, ")")).test(d)) {
            var t,
                a = "S+" === k ? "000" : "00";
            d = d.replace(RegExp.$1, 1 == RegExp.$1.length ? l[k] : ("".concat(a) + l[k]).substr("".concat(l[k]).length))
        }
    }
    return d;
}

function jsonParse(str) {
    if (typeof str == "string") {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.log(e);
            $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
            return [];
        }
    }
}
function timeFormat(time) {
    let date;
    if (time) {
        date = new Date(time)
    } else {
        date = new Date();
    }
    return date.getFullYear() + '-' + ((date.getMonth() + 1) >= 10 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) + '-' + (date.getDate() >= 10 ? date.getDate() : '0' + date.getDate());
}


function GetDateTime(date) {

    var timeString = "";

    var timeString = date.getFullYear() + "-";
    if ((date.getMonth() + 1) < 10)
        timeString += "0" + (date.getMonth() + 1) + "-";
    else
        timeString += (date.getMonth() + 1) + "-";

    if ((date.getDate()) < 10)
        timeString += "0" + date.getDate() + " ";
    else
        timeString += date.getDate() + " ";

    if ((date.getHours()) < 10)
        timeString += "0" + date.getHours() + ":";
    else
        timeString += date.getHours() + ":";

    if ((date.getMinutes()) < 10)
        timeString += "0" + date.getMinutes() + ":";
    else
        timeString += date.getMinutes() + ":";

    if ((date.getSeconds()) < 10)
        timeString += "0" + date.getSeconds();
    else
        timeString += date.getSeconds();

    return timeString;
}

async function getuserinfo() {
    var body = [{ "pin": "$cooMrdGatewayUid$" }];
    var ua = `jdapp;iPhone;${random(["11.1.0", "10.5.0", "10.3.6"])};${random(["13.5", "14.0", "15.0"])};${uuidRandom()};network/wifi;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone11,6;addressid/7565095847;supportBestPay/0;appBuild/167541;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`;

    let config = {
        url: 'https://lop-proxy.jd.com/JingIntegralApi/userAccount',
        body: JSON.stringify(body),
        headers: {
            "host": "lop-proxy.jd.com",
            "jexpress-report-time": Date.now().toString(),
            "access": "H5",
            "source-client": "2",
            "accept": "application/json, text/plain, */*",
            "d_model": "iPhone11,6",
            "accept-encoding": "gzip",
            "lop-dn": "jingcai.jd.com",
            "user-agent": ua,
            "partner": "",
            "screen": "375*812",
            "cookie": cookie,
            "x-requested-with": "XMLHttpRequest",
            "version": "1.0.0",
            "uuid": randomNumber(10),
            "clientinfo": "{\"appName\":\"jingcai\",\"client\":\"m\"}",
            "d_brand": "iPhone",
            "appparams": "{\"appid\":158,\"ticket_type\":\"m\"}",
            "sdkversion": "1.0.7",
            "area": area(),
            "client": "iOS",
            "referer": "https://jingcai-h5.jd.com/",
            "eid": "",
            "osversion": random(["13.5", "14.0", "15.0"]),
            "networktype": "wifi",
            "jexpress-trace-id": uuid(),
            "origin": "https://jingcai-h5.jd.com",
            "app-key": "jexpress",
            "event-id": uuid(),
            "clientversion": random(["11.1.0", "10.5.0", "10.3.6"]),
            "content-type": "application/json;charset=utf-8",
            "build": "167541",
            "biz-type": "service-monitor",
            "forcebot": "0"
        }
    }
    return new Promise(resolve => {
        $.post(config, async (err, resp, data) => {
            try {
                //console.log(data)
                if (err) {
                    console.log(err)
                } else {
                    data = JSON.parse(data);
                }
            } catch (e) {
                $.logErr(e, resp)
            }
            finally {
                resolve(data || '');
            }
        })
    })
}
function dwappinfo() {
    let ts = Date.now();
    let opt = {
        url: `https://dwapp.jd.com/user/dwSignInfo`,
        body: JSON.stringify({ "t": ts, "channelSource": "txzs", "encStr": CR.MD5(ts + 'e9c398ffcb2d4824b4d0a703e38yffdd').toString() }),
        headers: {
            'Origin': 'https://txsm-m.jd.com',
            'Content-Type': 'application/json',
            'User-Agent': $.UA,
            'Cookie': cookie
        }
    }
    return new Promise(async (resolve) => {
        $.post(opt, async (err, resp, data) => {
            let ccc = '';
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`dwappinfo 请求失败，请检查网路重试`)
                } else {
                    data = JSON.parse(data);
                    if (data.code == 200) {
                        ccc = data.data.balanceNum;
                    } else {
                        console.log(data.msg);
                    }
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve(ccc);
            }
        })
    })
}
function dwappexpire() {
    let opt = {
        url: `https://api.m.jd.com/api?functionId=DATAWALLET_USER_QUERY_EXPIRED_SCORE&appid=h5-sep&body=%7B%22expireDayNum%22%3A7%7D&client=m&clientVersion=6.0.0`,
        headers: {
			'Origin':'https://prodev.m.jd.com',
            'User-Agent': $.UA,
            'Cookie': cookie
        }
    }
    return new Promise(async (resolve) => {
        $.post(opt, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`dwappexpire 请求失败，请检查网路重试`)
                } else {
                    data = JSON.parse(data)
                    if (data.code == 200) {
                        data = data.data.expireNum;
						
                    } else {
                        //console.log(data.msg);
                        data = '';
                    }
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve(data);
            }
        })
    })
}

function getek() {
    let opt = {
        url: `https://mygiftcard.jd.com/giftcard/queryChannelUserCard`,
        //body: `appid=wh5&clientVersion=1.0.0&functionId=wanrentuan_superise_send&body={"channel":2}&area=2_2813_61130_0`,
        headers: {
            //'Host': 'api.m.jd.com',
            'Origin': 'https://o.jd.com',
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': $.UA,
            'Cookie': cookie
        }
    }
    return new Promise(async (resolve) => {
        $.get(opt, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`getek请求失败!!!!`)
                } else {
                    data = JSON.parse(data)
                    if (data.code == 000000) {
                        $.ECardinfo = Number(data.data.totalAmount);
                    } else {
                        console.log(data.msg)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data)
            }
        })
    })
}
function marketCard() {
    let opt = {
        url: `https://api.m.jd.com/atop_channel_marketCard_cardInfo`,
        body: `appid=jd-super-market&t=${Date.now()}&functionId=atop_channel_marketCard_cardInfo&client=m&uuid=&body=%7B%22babelChannel%22%3A%22ttt9%22%2C%22isJdApp%22%3A%221%22%2C%22isWx%22%3A%220%22%7D`,
        headers: {
            'Origin': 'https://pro.m.jd.com',
            'User-Agent': $.UA,
            'Cookie': cookie
        }
    }
    let carddata = '';
    return new Promise(async (resolve) => {
        $.post(opt, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`marketCard 请求失败，请检查网路重试`)
                } else {
                    data = JSON.parse(data)
                    if (data.success) {
                        carddata = data.data?.floorData?.items ? data.data?.floorData?.items[0].marketCardVO : '';
                    } else {
                    }
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve(carddata);
            }
        })
    })
}
function newfarm_info() {
    let opt = {
        url: `https://api.m.jd.com/client.action`,
        body: `appid=signed_wh5&client=android&clientVersion=12.4.2&screen=393*0&wqDefault=false&build=99108&osVersion=12&t=${Date.now()}&body={"version":1,"type":1}&functionId=farm_award_detail`,
        headers: {
            'Origin': 'https://h5.m.jd.com',
            'User-Agent': $.UA,
            'Cookie': cookie
        }
    }
    return new Promise(async (resolve) => {
        $.post(opt, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`newfarm_info 请求失败，请检查网路重试`)
                } else {
                    
                    data = JSON.parse(data);
                    if (data.data.success) {
                        if (data.data.result.plantAwards.length > 0){
                            for (let i of  data.data.result.plantAwards ){
                                if (i.awardStatus == 1){
                                    $.newfarm_info = `${i.skuName} -> ${i.exchangeRemind}`;
                                }
                            }
                        }
                    } else {
                    }
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve();
            }
        })
    })
}

function area() {
    let i = getRand(1, 30)
    let o = getRand(70, 3000)
    let x = getRand(900, 60000)
    let g = getRand(600, 30000)
    let a = i + '_' + o + '_' + x + '_' + g;
    return a
};
function getRand(min, max) {
    return parseInt(Math.random() * (max - min)) + min;
};
function uuid() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
    s[8] = s[13] = s[18] = s[23] = "-";
    var uuid = s.join("");
    return uuid;
};
function uuidRandom() {
    return Math.random().toString(16).slice(2, 10) +
        Math.random().toString(16).slice(2, 10) +
        Math.random().toString(16).slice(2, 10) +
        Math.random().toString(16).slice(2, 10) +
        Math.random().toString(16).slice(2, 10);
}
function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function randomNumber(len) {
    let chars = '0123456789';
    let maxPos = chars.length;
    let str = '';
    for (let i = 0; i < len; i++) {
        str += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return Date.now() + str;
}
var _0xodh='jsjiami.com.v7';const _0x41ebac=_0x3071;(function(_0x8af337,_0x49a4c0,_0x33f788,_0x3b6ec0,_0x2d7fde,_0x1d002c,_0x50cedc){return _0x8af337=_0x8af337>>0x8,_0x1d002c='hs',_0x50cedc='hs',function(_0x1ac2d4,_0x3f2c09,_0x44da69,_0x35aea9,_0x6c63e0){const _0x3d3f83=_0x3071;_0x35aea9='tfi',_0x1d002c=_0x35aea9+_0x1d002c,_0x6c63e0='up',_0x50cedc+=_0x6c63e0,_0x1d002c=_0x44da69(_0x1d002c),_0x50cedc=_0x44da69(_0x50cedc),_0x44da69=0x0;const _0x27742c=_0x1ac2d4();while(!![]&&--_0x3b6ec0+_0x3f2c09){try{_0x35aea9=-parseInt(_0x3d3f83(0x22d,'K6XO'))/0x1*(-parseInt(_0x3d3f83(0x247,'PayE'))/0x2)+-parseInt(_0x3d3f83(0x224,'q#Xr'))/0x3*(-parseInt(_0x3d3f83(0x1b6,'eOHl'))/0x4)+-parseInt(_0x3d3f83(0x180,'ELeq'))/0x5+parseInt(_0x3d3f83(0x23b,'w]GV'))/0x6*(-parseInt(_0x3d3f83(0x27f,'kFTi'))/0x7)+parseInt(_0x3d3f83(0x18e,'%!mB'))/0x8*(-parseInt(_0x3d3f83(0x1a5,'UgR]'))/0x9)+parseInt(_0x3d3f83(0x222,'ELeq'))/0xa+-parseInt(_0x3d3f83(0x24b,'PayE'))/0xb*(-parseInt(_0x3d3f83(0x23f,'U8pN'))/0xc);}catch(_0x41f025){_0x35aea9=_0x44da69;}finally{_0x6c63e0=_0x27742c[_0x1d002c]();if(_0x8af337<=_0x3b6ec0)_0x44da69?_0x2d7fde?_0x35aea9=_0x6c63e0:_0x2d7fde=_0x6c63e0:_0x44da69=_0x6c63e0;else{if(_0x44da69==_0x2d7fde['replace'](/[qAVTngXYbhyuQKdJEM=]/g,'')){if(_0x35aea9===_0x3f2c09){_0x27742c['un'+_0x1d002c](_0x6c63e0);break;}_0x27742c[_0x50cedc](_0x6c63e0);}}}}}(_0x33f788,_0x49a4c0,function(_0x432b05,_0x4136d5,_0x143080,_0x5e616d,_0x5e4daf,_0x207aff,_0x21b51d){return _0x4136d5='\x73\x70\x6c\x69\x74',_0x432b05=arguments[0x0],_0x432b05=_0x432b05[_0x4136d5](''),_0x143080=`\x72\x65\x76\x65\x72\x73\x65`,_0x432b05=_0x432b05[_0x143080]('\x76'),_0x5e616d=`\x6a\x6f\x69\x6e`,(0x15db44,_0x432b05[_0x5e616d](''));});}(0xc300,0xc43fe,_0x1bc8,0xc5),_0x1bc8)&&(_0xodh=_0x1bc8);const _0x2c248e=(function(){const _0x456c08=_0x3071,_0xe1c0f6={'VPpmY':function(_0x27b4dc,_0x2f0bd6){return _0x27b4dc(_0x2f0bd6);},'sCWqx':function(_0x38fad4,_0x5bcaa8){return _0x38fad4!==_0x5bcaa8;},'iznYE':_0x456c08(0x195,'UqUN'),'wRojO':_0x456c08(0x21e,'gk9X')};let _0x2775b2=!![];return function(_0x800c80,_0xf3ae9a){const _0x3a23d9=_0x456c08,_0x381b00={'wxvLY':function(_0x5da3ca,_0x5da327){const _0x521035=_0x3071;return _0xe1c0f6[_0x521035(0x17e,'7oy1')](_0x5da3ca,_0x5da327);},'EtWvl':function(_0x1b6313,_0x5a9c5f){const _0x18d539=_0x3071;return _0xe1c0f6[_0x18d539(0x18d,'8!5v')](_0x1b6313,_0x5a9c5f);},'mgyCK':_0xe1c0f6[_0x3a23d9(0x24d,'tJk2')],'akONK':_0xe1c0f6[_0x3a23d9(0x179,'eOHl')]},_0x513b24=_0x2775b2?function(){const _0x4ebdd7=_0x3a23d9,_0x23c908={'EWyXf':function(_0x5e388d,_0x95e14){const _0x5f5976=_0x3071;return _0x381b00[_0x5f5976(0x1d8,'gS6[')](_0x5e388d,_0x95e14);}};if(_0x381b00[_0x4ebdd7(0x204,'F]tC')](_0x381b00[_0x4ebdd7(0x1a6,'qpur')],_0x381b00[_0x4ebdd7(0x20b,'kFTi')])){if(_0xf3ae9a){const _0x300320=_0xf3ae9a[_0x4ebdd7(0x206,'ELeq')](_0x800c80,arguments);return _0xf3ae9a=null,_0x300320;}}else _0x23c908[_0x4ebdd7(0x172,'J8tj')](_0x24a482,_0x239f1a);}:function(){};return _0x2775b2=![],_0x513b24;};}()),_0x2f1445=_0x2c248e(this,function(){const _0x2bf1c3=_0x3071,_0x10275b={'VSaZu':_0x2bf1c3(0x1f5,'hiEw')};return _0x2f1445[_0x2bf1c3(0x268,'Wcss')]()[_0x2bf1c3(0x1f3,'kFTi')](_0x10275b[_0x2bf1c3(0x252,'y8PE')])[_0x2bf1c3(0x1c2,'K6XO')]()[_0x2bf1c3(0x1d5,'hHPz')](_0x2f1445)[_0x2bf1c3(0x210,'mTdx')](_0x10275b[_0x2bf1c3(0x19b,'UqUN')]);});_0x2f1445();const _0x107a58=require(_0x41ebac(0x1d3,'q#Xr')),_0x4dd4af=require(_0x41ebac(0x186,'hHPz')),_0x2a8597=require(_0x41ebac(0x1b2,'PayE'));function _0x1bc8(){const _0x1bf7e9=(function(){return[...[_0xodh,'qAjVbsVjYXiAMamJMniyMK.dQgcMhobuEmTY.Xv7==','W4W2WRldQ8oj','wCkoWQnTWQLQW6/cGq','WQddJK52W57cK8kKW5/cOh7cOCkJWOpcJW','e8kNW5BdJmol','CCkcqHddUq','W6FdN3vDWO9mdJ4','W43cIbq2gG','rCkuDY/dUW','WRFdV1yruW','W582w8kb','amodd0/cIq','WRpcSmoVkmko','e2nt','WPfIWPFcMXJcIs9tpSoElCkIDenx','vYX/xHddNsxdUCkNWPu','nwHagCojwcmHWQWbxZZcMCoNW7mIW5a','zmonrCoPlG','umoEWOn3W5ldLNLWWPCQW7PFuK7cS3hcTW','W4mBWQJdHSoG','o8o8iMFcUW','vSkIDqBdJG','kmkgWQ/dK8oB','WO/dR8kmxc/dRmkYWQC','W7eYWQ7dKmo+W74YfCkDW4lcISohyG','udD5vHldQs/dSmkS','BmkeoCkkWRi','x8oqWP53WO3dJdi6WOeQW65ygq/cVxNcOvJdVKz0','h8oap1RcQG','tJWdwSkucrGiWRqhwbG','WQVdGSkAxxS','WPlcSL/cUw0','iHjoWOq','WP5yW45sWPddMf1TWQK','qYKQW4OGW7xdTx7dUYtdGmotuavDmrn3E8kMWOJcNCojW4rT','W5WFW5PmCW','j8kWW6/dOSokW5j3rb4','W4y9zIpcKW','sSkSya','5PEt5yE55zYL5P2t6k2v5AEV6lAN','hmkPj8okWPq','WOWTiadcMq','WQJdQNquCbdcQ8kij0RcHSkw','WOzJWOlcIq4','dCkKfSo1WPzRdMpcNSk/zCoFWPDo','ASkKa8kSWQRdQa','sSoJAa','WOxcUCobjCkrW6S','WOZdUYO','WQldNZvUWQq','tYXS','W6CTBJFcVW','jJjMW67dKq','WPvFWOpcNcC','F0tcGCkukG','WRZcMty3Ea','W4JdNfe9zwD/W6u','uc4NW6e0','W6KuvH3cKW','WOSEprNcSW','W5TxsHDm','WOj0WQRdGe/dPSogW7DuW6PGWRDU','W5GgW7jox3ddTJW','jbjhW5RdSG','W5ehWQr+FG','WO1KWOBcJJ/dNhqDoSkUBCkQke5kW6BdQHDQW5u','W5xcRx8pW41zbSohBmkBlg17','WQiLW6bkca','W4RdIKv/WQu','kNPhmSoK','i8kvtmofoJBcLMK','gcOPxxy','jmkpWRxcNmoOWO/cVSoAxCkiWQnzWQNcOSolW4Hi','W4rlqYzmFq','W43dK1qjxG','EmoRWP5JWPu','omkaimkq6kYX5RoE5AAy6lEk77256kYD5Qkp5P2057+A6lE/6ysu6k6O','WPmKW4HYW7i','WO9eW49ZWQldLu8','W4GuEmkrWPe','W4DIWPLYkcaHubS','sSo/WPZcJtG','WOevW4TwW5RcNHO','W7GUW4JcGsu','WPDKWPP+aG','W4JdNfe9C2f2W6DD','WRaiW6jwdW','xruQW6aO','t8oJFa','CCogwSkQxq','WOW+WQyrexioW7RdUcFcQSoOlmkMW4m8WOvNW6FdGZrRESklm8kXAmoAWQBdKMFcVdv9W580dCkqBSoy','EmoGWObfWRy','Dmofr8oohW7cNwW','yHmLW7qw','WO8GW4TGW4q','W4BdIvCGxZm2WQviW57cMCkImCoLWRRcKSkaWQVdUCoSsgS','WR/cIwlcLgK7','l8ocbeNcNq'],...(function(){return[...['A8khWP5sWOq','WP8tW4ZdHmoa','WQpdIeG','CmkCl8kbdW','WRisW5rZW40','WP0qefmgowRcUfbLWQLZ','wSodWPneWRu','c8ohwelcOa','W4BdIvCGxZm2WQvzW4lcHCo/CSkMW77cNmokW6BdTCoUcIumv8kFWOupWOTliCkBW4pdHCowhCkCtZNdT1DZCCk9stXnoh7cMNrpWRFdKNFdJG','CSkOW7ldRmonW5TkwXDwW4nXW4ftmgJcIHDFfmktW4XYWR0','W7VdJKyIyMH0W68','WQzhWQhcHX8','hNXDrCobeX0QW7ydxbq','mCoqFgpcKW','BCkYfCkRWPxdPCohWPSDWO88W7JdSxxcIH4lWQj+','smkuAWhdRa','umoJWRNcHmom','W5NcSSkTBrNdHmkn','B1jmWPq4WOpcUmk0qmkLW4atWPfPWPNcJCoV','eZz0W77dHW','mSoUwG','W6aYWQbXsmoAra','W458zKhdJSosWOxdL2BdK8offW','o8kbWOJdVG','fevvaSok','WOaeW4X7W5y','dmkQkCo1WRa','WOldOSkKEgRdUGf3r8oTWQ5MW59wchJdPheSWQRdVrvfW4uAoCkaWQRdPCosWPNdVH3cLSkKtgHCWQfACG0jWRLVemoPkNNcOSk7lMW','W5VdU8kIWQ1g','lJmrw38','E8kTmKit','gos6Uos4QEweV+wDRfRdM0jyBUAFPEIVIUITH+AWG+wKV+I1ISk/4Oow77QP4OoJ77IW','WOyKFZdcSSooWQ3dKIRdQSkArmoLka','WPjOW4frWPy','pmoJhxRcVt0YWRi','yCoqr8okoaFcKMvX','W6ZdIhOhrG','bmkOW6JdUmoqW5PQqWTGWP0SWPvA','WQ9gW5neWPu','WPiLkWtcIq','WOlcVrKWsH/cTSkifSkJyfxcL0aTxa','wSkQpa','W6FdO3jcWRO','DCkYsJFdUG','WO3dS8kK','W5pdKti5jIRdMSk5D2FdL8kWWQLOttS2CIJdKJa','5PEy5yEx5z2H5P+l6k+X5Awo6lAD','f1Xve8oT','W4BcJcK6WP4','WOZdP3Krya','W64OWPNdUCoh','WRZdLr83WOddHCoPWOtcGLhdPCkpWPZcKXDvha','WRCKW41MW70','ACopWR3cMSoYWP7cV8oqrSkjW74','W6iwwGZcIG','WR/cHGiAsW','vmo0BCkjBq','WRxcH3FcVe46yafwk08','s8kwWQ9iWQ0','W4NdH0OGacL9W69EW57cJCkLESkKWRtcMSkw','WPZcJrm6yefUW7bm','W7tcMWSVWRVdLCo4WP/cVu3cPq','WP9zW45fWPZdI1LTWPKqW6hcUHjNW6i7aSocWPq','BmkJeKiw','W6S4WRm','WP0xW7pdJmoE','WOysWRqknW','yCkifKyW','o8oDwulcPYNdGmkOn8oddgbVCGNdJCkUW7xcOCk2wCkEWQxcLqu','rSo5WRhcJ8oN','imkJW4VdJ8om','WRNcJCohW4uMW7xcI8kPWRPpWQP0','WOVcUCocgCoE','jmkOW6JdUmoXW4z7ucvsWO0MWQ5rowa','W7dcIr0yWQS','W7quDbq','qCo1sSkuCW','gCk6WQBdJSoG','WP8JnHy','CmkibSkVWOi','c8kuWR/cUZldV8oYvq','W6FdKSku','DSoRC8kqEG','dgLvgCopvq','W41WqIjW','W404W5RdKgFdJ3aBECkYAmoJ','WOZdUYP+WOWy','WQmKW47dICoY','WQbtWPFcKGG','Amk6B8kQytLrvWy','WOqXW41GW7S','W7ZcKGOGWQ0','W6yMWRv6Da','WQeRW6T0ha','d8kuWQtdT8ow','W5lcVCkKta','W7/dT8kKWPv2','W7a1WR7dKmoz','WQJdGGPPWQS'],...(function(){return['WOarW41zW7ZcLaxdOG','W4GbW4bkFq','W7nYCmoEW7a','WOhdPd1xWOC','gx5baSoyuXi5WReovry','imozAhJcVa','W67cS8keFJ8','dSkGg8oNWRO','hMD7jCoN','WQ1qW7ntWQW','b8ocsvVcOq','W7VdI1ajza','jca9yfO','A8kKeCkRWQxdTa','W4bMWP0Oxf46wYBdV8oDW4O','W5eSW6RcMtxcU8kvW7C','FSoXWQLtWPC','pmkUW4VdRmod','WPldSt5oWPiE','W4lcLGWXWPRdICoPWOZcGwZcQCkeWPFcMG','qMrX','W7hcHHvpWPS','WOGLWRu','WQ7dKmkuAwO','uYj5tbK','WRRcLvxcVw46uXP2','WOm/W41rmq','WP0qW4/dLSoL','W5aGWP1bsW','DSoLu8o6ha','W6FdKSkuWRjMWRC','W5hcPx0iW4PyaCkyBCkMow9yCG','pSkpWP7dTSoxWRFcU8oeW5JdJCof','WQhdItW3WRNdT8orWR0','WOe9W515cdS1rr3dGW','xSoxWRtcMCoK','W6aACWe','W5RdM8kuWO5h','wKZcQ8kGdW','WOVdVvakyaBcUmkpmG','W6L7uSoSW4K','WRtcG3hcS3qTFa','Cmk0bx/cGZyWWPe','WOz9WQ/dHutdOCkCW55oW4fDWPa','A8kHBSk3','WR4HW7NdL8oazmkmuhBdMSo+EdZcSCoNWQ7dNCorEq','qmkIDrJdVGGgbrn+WOy','ymksWQfAWPv5','W6/cQmk6rb0','CeWAW5jIW5ldVSoTwmk6WQWZWOPx','W5WnaJRORiVMSQdLP6BOTP/VVj3ORAZMOAFMNPhNVPROT77PHzBORym','W6auCGBcTq','WQ0ZW67dImoAC8kesW','WPicW5PrW7dcLaBdV1yy','o8k6fSoVWPzQh3xcM8kcymoF','ucPSurNdQHNdOCk9W4u','a8o8B0mnvMnTWOa','WOJcU8ofaSkq','kmkcWPNdQmoDWQBcQ8ofW6hdKCopWOJcSq','WOe2W5RdHmoHCmkYvNhdM8odCcVcSq','B8o8vmkYW5iXqZdcV8kTBCo4WOnB','vmoSWOzvWQC','ECkTWOLzWRq','sCoeW5NcItdcSCoKECoWjfiYusXLW4zun2m','aSkDW55oWOJcUv9rWPq','WO1KWOBcJJ/dNhqDoSkUBCkQke5kW6BdQHDQ','W7/dN0fSWO9x','fmo6nexcMZa7aGj0WPO','C0qzW5fMWQVcLmkOBSkZWPW','CZbTBd8','WPDjW5VdQ8ow','WOhdPd1xWPCjuSoCC8k4farcdCoHvSo1y8kIWPJcKJFdOmkzlxpdSfldVfuFbSoa','CeXtWOC6WRBcOCk3','WOFKUANKUOVLHQdLNkSRWRSyvshMNjZORyxOR4RMSBBLP4hOTRfE4OgZ77U94Ogk77Qp','WOVdTg4/ua','x8oqWP53WO3dJdi6WPiNW6LztKZdVJ3cRXlcS0P2WRtdRG','b8kABvvmrHG','5Psy5yA45zYE5P6g6k+C5As+6lsJ','qSogrSoOoq','WRizWRm7fW','W60ex8kdWQy','c8kAWP/dTSoN','WOrGWOlcKJu','W53dIve5qM5WW6Xb','WQWZW67dRmo2','DmkUfW','WPLWW6rNWPC','WRpcVmoKe8kO','WPOTib7cTCkmWRhdLq','d21ggmoj','jmkRW67dVW','bCoTA8k1xviVW6L6CW','WQvjW7TcWPO','WPxdPYHjWQ0txCoCCSkYcujarCofqSoTpmkH','lmkCWONdVSorWRdcV8ocW60','W5C4smkLWPVcUW'];}())];}())];}());_0x1bc8=function(){return _0x1bf7e9;};return _0x1bc8();};async function queryScores(){const _0x5391ba=_0x41ebac,_0x2c82b9={'ShxaX':function(_0x1530b4,_0xe53ec5){return _0x1530b4===_0xe53ec5;},'byQQG':_0x5391ba(0x23c,'^l)k'),'BEseA':function(_0x3b1058,_0x47da4b){return _0x3b1058==_0x47da4b;},'PFQZR':function(_0x5742ee){return _0x5742ee();},'TvPxp':_0x5391ba(0x192,'%!mB'),'qkesx':_0x5391ba(0x284,'UqUN'),'WMMLK':_0x5391ba(0x23d,'Iw^Y'),'GKLMQ':_0x5391ba(0x198,'y8PE')};let _0x2e72f3='',_0x51a559={'appId':_0x2c82b9[_0x5391ba(0x1d0,'q#Xr')],'fn':_0x2c82b9[_0x5391ba(0x201,'4Z(1')],'body':{},'apid':_0x2c82b9[_0x5391ba(0x1e3,'w]GV')],'user':$[_0x5391ba(0x264,'RW]a')],'code':0x0,'ua':$['UA']};body=await _0x107a58[_0x5391ba(0x1b5,'7oy1')](_0x51a559);let _0x1db5e9={'url':_0x5391ba(0x1e4,'AqDq')+body+_0x5391ba(0x1a9,'wYoV'),'headers':{'Cookie':cookie,'User-Agent':$['UA'],'Referer':_0x2c82b9[_0x5391ba(0x229,'xdI%')]}};return new Promise(_0x502776=>{const _0x2262ab=_0x5391ba;$[_0x2262ab(0x22f,'GSLl')](_0x1db5e9,async(_0x34cc40,_0x4f0794,_0x20fa67)=>{const _0x395738=_0x2262ab;if(_0x2c82b9[_0x395738(0x20a,'U8pN')](_0x2c82b9[_0x395738(0x1ec,'gS6[')],_0x2c82b9[_0x395738(0x1ad,'AqDq')]))try{const _0x5a2e86=JSON[_0x395738(0x277,'[Tsa')](_0x20fa67);_0x2c82b9[_0x395738(0x275,'4Z(1')](_0x5a2e86[_0x395738(0x282,'PayE')],0x3e8)&&($[_0x395738(0x16a,'U8pN')]=_0x5a2e86['rs'][_0x395738(0x260,'ELeq')][_0x395738(0x271,'01JI')]);}catch(_0x190e14){$[_0x395738(0x16d,'^l)k')](_0x190e14,_0x4f0794);}finally{_0x2c82b9[_0x395738(0x1bc,'&m6X')](_0x502776);}else _0xaf912c[_0x395738(0x216,'q#Xr')]=_0x238c93['rs'][_0x395738(0x230,'gk9X')][_0x395738(0x225,'%!mB')];});});}function _0x3071(_0x1773eb,_0x549513){const _0x763031=_0x1bc8();return _0x3071=function(_0x49cfc9,_0x16811d){_0x49cfc9=_0x49cfc9-0x164;let _0x1bc807=_0x763031[_0x49cfc9];if(_0x3071['GNgpbM']===undefined){var _0x30711f=function(_0x33d80f){const _0x296215='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let _0x59b0fb='',_0x2e2962='',_0x591875=_0x59b0fb+_0x30711f;for(let _0x4a1627=0x0,_0x2e87aa,_0x4332ce,_0x516b7a=0x0;_0x4332ce=_0x33d80f['charAt'](_0x516b7a++);~_0x4332ce&&(_0x2e87aa=_0x4a1627%0x4?_0x2e87aa*0x40+_0x4332ce:_0x4332ce,_0x4a1627++%0x4)?_0x59b0fb+=_0x591875['charCodeAt'](_0x516b7a+0xa)-0xa!==0x0?String['fromCharCode'](0xff&_0x2e87aa>>(-0x2*_0x4a1627&0x6)):_0x4a1627:0x0){_0x4332ce=_0x296215['indexOf'](_0x4332ce);}for(let _0x5c2786=0x0,_0x294c15=_0x59b0fb['length'];_0x5c2786<_0x294c15;_0x5c2786++){_0x2e2962+='%'+('00'+_0x59b0fb['charCodeAt'](_0x5c2786)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x2e2962);};const _0x16558f=function(_0x569133,_0x3376e0){let _0x4a3d9e=[],_0x3b6b77=0x0,_0x1a532e,_0x51b3df='';_0x569133=_0x30711f(_0x569133);let _0x362977;for(_0x362977=0x0;_0x362977<0x100;_0x362977++){_0x4a3d9e[_0x362977]=_0x362977;}for(_0x362977=0x0;_0x362977<0x100;_0x362977++){_0x3b6b77=(_0x3b6b77+_0x4a3d9e[_0x362977]+_0x3376e0['charCodeAt'](_0x362977%_0x3376e0['length']))%0x100,_0x1a532e=_0x4a3d9e[_0x362977],_0x4a3d9e[_0x362977]=_0x4a3d9e[_0x3b6b77],_0x4a3d9e[_0x3b6b77]=_0x1a532e;}_0x362977=0x0,_0x3b6b77=0x0;for(let _0x27ec5d=0x0;_0x27ec5d<_0x569133['length'];_0x27ec5d++){_0x362977=(_0x362977+0x1)%0x100,_0x3b6b77=(_0x3b6b77+_0x4a3d9e[_0x362977])%0x100,_0x1a532e=_0x4a3d9e[_0x362977],_0x4a3d9e[_0x362977]=_0x4a3d9e[_0x3b6b77],_0x4a3d9e[_0x3b6b77]=_0x1a532e,_0x51b3df+=String['fromCharCode'](_0x569133['charCodeAt'](_0x27ec5d)^_0x4a3d9e[(_0x4a3d9e[_0x362977]+_0x4a3d9e[_0x3b6b77])%0x100]);}return _0x51b3df;};_0x3071['NrvGVq']=_0x16558f,_0x1773eb=arguments,_0x3071['GNgpbM']=!![];}const _0x4b4aae=_0x763031[0x0],_0x3861fe=_0x49cfc9+_0x4b4aae,_0x3cd931=_0x1773eb[_0x3861fe];if(!_0x3cd931){if(_0x3071['lWjZzG']===undefined){const _0x3d8d88=function(_0xed5625){this['SkOpnZ']=_0xed5625,this['LFsNjX']=[0x1,0x0,0x0],this['CniObZ']=function(){return'newState';},this['phenkt']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*',this['MzniNM']='[\x27|\x22].+[\x27|\x22];?\x20*}';};_0x3d8d88['prototype']['aiEOyN']=function(){const _0x4450d4=new RegExp(this['phenkt']+this['MzniNM']),_0x4e1856=_0x4450d4['test'](this['CniObZ']['toString']())?--this['LFsNjX'][0x1]:--this['LFsNjX'][0x0];return this['PRICzt'](_0x4e1856);},_0x3d8d88['prototype']['PRICzt']=function(_0x39b1c3){if(!Boolean(~_0x39b1c3))return _0x39b1c3;return this['hTVWHY'](this['SkOpnZ']);},_0x3d8d88['prototype']['hTVWHY']=function(_0x44768f){for(let _0x669c04=0x0,_0xb79ba7=this['LFsNjX']['length'];_0x669c04<_0xb79ba7;_0x669c04++){this['LFsNjX']['push'](Math['round'](Math['random']())),_0xb79ba7=this['LFsNjX']['length'];}return _0x44768f(this['LFsNjX'][0x0]);},new _0x3d8d88(_0x3071)['aiEOyN'](),_0x3071['lWjZzG']=!![];}_0x1bc807=_0x3071['NrvGVq'](_0x1bc807,_0x16811d),_0x1773eb[_0x3861fe]=_0x1bc807;}else _0x1bc807=_0x3cd931;return _0x1bc807;},_0x3071(_0x1773eb,_0x549513);}async function fruitinfo(){const _0x3da60b=_0x41ebac,_0x2cfc54={'TAPaS':function(_0x43e31d){return _0x43e31d();},'hIvvD':function(_0x4dfcab,_0x3d5fda){return _0x4dfcab===_0x3d5fda;},'OOtdk':_0x3da60b(0x259,'7Bd]'),'YzcVX':_0x3da60b(0x1af,'[Tsa'),'tgVDh':function(_0x510d89,_0x556746){return _0x510d89!==_0x556746;},'EZKNk':_0x3da60b(0x1c4,'z!Yv'),'Tkdiu':function(_0x4221e4,_0x3531d0){return _0x4221e4===_0x3531d0;},'VSpcO':_0x3da60b(0x1a7,'AqDq'),'cWpZP':_0x3da60b(0x1fc,'7oy1'),'gzXMc':_0x3da60b(0x1bf,']UH3'),'SmnFg':function(_0x1a15f9,_0x21509e){return _0x1a15f9(_0x21509e);},'gNJGR':_0x3da60b(0x228,'&m6X'),'VEoiM':_0x3da60b(0x177,'UqUN'),'TyBlx':function(_0x2a2edc){return _0x2a2edc();},'ECelD':function(_0x177c50,_0x267a81){return _0x177c50(_0x267a81);},'RoMWG':_0x3da60b(0x1a2,'q#Xr'),'BKxUZ':_0x3da60b(0x217,'Ai90'),'ATZhv':_0x3da60b(0x274,'qpur'),'LYbfa':_0x3da60b(0x1c0,'eOHl'),'ATJUb':_0x3da60b(0x24e,'qpur'),'ZjBsK':_0x3da60b(0x24a,'ELeq')};return new Promise(_0x310834=>{const _0x598fdf=_0x3da60b,_0x543f46={'hjVgg':function(_0x3a0ad8){const _0x3e59e1=_0x3071;return _0x2cfc54[_0x3e59e1(0x1a1,'gk9X')](_0x3a0ad8);},'MhiHh':function(_0x177c96,_0x33cdca){const _0x76f906=_0x3071;return _0x2cfc54[_0x76f906(0x1ef,'mTdx')](_0x177c96,_0x33cdca);},'uTwFG':_0x2cfc54[_0x598fdf(0x189,'qpur')],'XyzJL':_0x2cfc54[_0x598fdf(0x182,'Wcss')],'hPaxA':function(_0x4afbbe,_0x393533){const _0x9372ca=_0x598fdf;return _0x2cfc54[_0x9372ca(0x1e6,'wYoV')](_0x4afbbe,_0x393533);},'ZfIHm':_0x2cfc54[_0x598fdf(0x194,'%!mB')],'WAEeR':function(_0x5a2add,_0x319717){const _0x4cffae=_0x598fdf;return _0x2cfc54[_0x4cffae(0x20d,'AqDq')](_0x5a2add,_0x319717);},'Twgpb':_0x2cfc54[_0x598fdf(0x253,'8!5v')],'SqMBQ':_0x2cfc54[_0x598fdf(0x26a,'[Tsa')],'NHZtg':_0x2cfc54[_0x598fdf(0x1a0,'RW]a')],'ssntr':function(_0x365b35,_0x6ddb55){const _0x7f42f3=_0x598fdf;return _0x2cfc54[_0x7f42f3(0x249,'L2x1')](_0x365b35,_0x6ddb55);},'yShGF':_0x2cfc54[_0x598fdf(0x19f,'K6XO')],'cspwB':_0x2cfc54[_0x598fdf(0x1e1,'gk9X')],'UqVwF':function(_0x54b077){const _0x254b40=_0x598fdf;return _0x2cfc54[_0x254b40(0x1fd,'%!mB')](_0x54b077);}},_0x2392e6={'url':_0x598fdf(0x1bb,'BOem'),'body':_0x598fdf(0x1e8,'^l)k')+_0x2cfc54[_0x598fdf(0x1f8,'hiEw')](encodeURIComponent,JSON[_0x598fdf(0x1c3,']UH3')]({'version':0x18,'channel':0x1,'babelChannel':_0x2cfc54[_0x598fdf(0x209,'cLtU')],'lat':'0','lng':'0'}))+_0x598fdf(0x25e,'gS6['),'headers':{'accept':_0x2cfc54[_0x598fdf(0x16f,'ELeq')],'accept-encoding':_0x2cfc54[_0x598fdf(0x281,'S)Be')],'accept-language':_0x2cfc54[_0x598fdf(0x1e5,'hHPz')],'cookie':cookie,'origin':_0x2cfc54[_0x598fdf(0x1ed,'Iw^Y')],'referer':_0x2cfc54[_0x598fdf(0x280,'BOem')],'User-Agent':$['UA'],'Content-Type':_0x2cfc54[_0x598fdf(0x25a,'^l)k')]},'timeout':0x2710};$[_0x598fdf(0x227,'GDgt')](_0x2392e6,(_0x3d09aa,_0x163aae,_0x2b3016)=>{const _0x2e73de=_0x598fdf,_0x47a2ed={'AaDLv':function(_0x4f28e8){const _0x4f92ae=_0x3071;return _0x543f46[_0x4f92ae(0x214,'wYoV')](_0x4f28e8);}};if(_0x543f46[_0x2e73de(0x263,'4Z(1')](_0x543f46[_0x2e73de(0x18b,'nry2')],_0x543f46[_0x2e73de(0x22b,'2N!l')])){const _0x2516c9=_0x516b7a?function(){const _0x251e76=_0x2e73de;if(_0x3b6b77){const _0x27cc76=_0x27ec5d[_0x251e76(0x255,'hiEw')](_0x3d8d88,arguments);return _0xed5625=null,_0x27cc76;}}:function(){};return _0x4a3d9e=![],_0x2516c9;}else try{_0x3d09aa?_0x543f46[_0x2e73de(0x1cf,'kFTi')](_0x543f46[_0x2e73de(0x26e,'^l)k')],_0x543f46[_0x2e73de(0x1df,'w]GV')])?_0x47a2ed[_0x2e73de(0x166,'U8pN')](_0x5bc1d1):(!llgeterror&&(_0x543f46[_0x2e73de(0x267,'[Tsa')](_0x543f46[_0x2e73de(0x226,'hHPz')],_0x543f46[_0x2e73de(0x1cb,'[Tsa')])?(_0x53ee13[_0x2e73de(0x1e0,'7oy1')](''+_0x307d35[_0x2e73de(0x256,'z!Yv')](_0x32de3d)),_0x59912d[_0x2e73de(0x219,'y8PE')](_0x2e73de(0x235,'eOHl'))):(console[_0x2e73de(0x1c9,'w]GV')](_0x543f46[_0x2e73de(0x175,'wv!o')]),console[_0x2e73de(0x196,'gS6[')](JSON[_0x2e73de(0x286,'wYoV')](_0x3d09aa)))),llgeterror=!![]):(llgeterror=![],_0x543f46[_0x2e73de(0x17a,'UgR]')](safeGet,_0x2b3016)&&($[_0x2e73de(0x176,'z!Yv')]=JSON[_0x2e73de(0x185,'Ai90')](_0x2b3016),$[_0x2e73de(0x237,'gk9X')][_0x2e73de(0x1d9,'S)Be')]&&($[_0x2e73de(0x23e,'gk9X')]=$[_0x2e73de(0x212,'D!Q@')][_0x2e73de(0x1dd,'q#Xr')][_0x2e73de(0x1ff,'cLtU')],$[_0x2e73de(0x168,'tJk2')]=$[_0x2e73de(0x19a,']UH3')][_0x2e73de(0x231,'[Tsa')][_0x2e73de(0x238,'nry2')],$[_0x2e73de(0x272,'kFTi')]=$[_0x2e73de(0x203,'nry2')][_0x2e73de(0x223,'Iw^Y')][_0x2e73de(0x270,'hiEw')],$[_0x2e73de(0x283,'7Bd]')]=$[_0x2e73de(0x25b,'eOHl')][_0x2e73de(0x231,'[Tsa')][_0x2e73de(0x261,'Iw^Y')])));}catch(_0x8c298f){$[_0x2e73de(0x245,'Wcss')](_0x8c298f,_0x163aae);}finally{_0x543f46[_0x2e73de(0x1be,'w]GV')](_0x543f46[_0x2e73de(0x18f,'2SBZ')],_0x543f46[_0x2e73de(0x169,'hiEw')])?_0x2e1491[_0x2e73de(0x187,'UgR]')](_0x46f3ae,_0x93df06):_0x543f46[_0x2e73de(0x26b,'tJk2')](_0x310834);}});});}async function fruitnew(_0x2ad1b0=0x1f4){const _0x3cfa3c=_0x41ebac,_0x3ff3c2={'LkfNI':_0x3cfa3c(0x24c,'F]tC'),'OcPuY':function(_0x3ca349,_0xc28876){return _0x3ca349===_0xc28876;},'GzXdo':_0x3cfa3c(0x171,'GDgt'),'cnwYr':_0x3cfa3c(0x1ba,'U8pN'),'ovBZf':function(_0x5dd788,_0x39c2e8){return _0x5dd788===_0x39c2e8;},'IUCTi':_0x3cfa3c(0x200,'&m6X'),'rcZyZ':_0x3cfa3c(0x1b0,'hHPz'),'kIaif':function(_0x33a1de,_0x503145){return _0x33a1de!==_0x503145;},'bArTN':_0x3cfa3c(0x248,'01JI'),'phCHY':function(_0x2c70b5,_0x55319a){return _0x2c70b5(_0x55319a);},'VHfVC':function(_0x2828d2){return _0x2828d2();},'UvsYH':_0x3cfa3c(0x1b3,'J8tj'),'DFDas':function(_0x15055a,_0x5d487f,_0x5a63d3){return _0x15055a(_0x5d487f,_0x5a63d3);},'bCfyt':_0x3cfa3c(0x269,'z!Yv'),'QTrRH':_0x3cfa3c(0x193,'z!Yv'),'GkiWJ':_0x3cfa3c(0x23a,'01JI'),'MWnYT':_0x3cfa3c(0x16c,'gS6['),'UghUN':_0x3cfa3c(0x1ac,'kFTi'),'dAfYJ':_0x3cfa3c(0x1b4,'mTdx'),'ElxsV':_0x3cfa3c(0x244,'hiEw'),'spEJh':_0x3cfa3c(0x1db,'z!Yv'),'WzHlT':_0x3cfa3c(0x242,'2SBZ'),'TbkGx':_0x3cfa3c(0x17f,'hiEw')};let _0x242607={'version':0x1},_0x50cc5c={'appId':_0x3ff3c2[_0x3cfa3c(0x174,'xdI%')],'fn':_0x3ff3c2[_0x3cfa3c(0x1d4,'nry2')],'body':_0x242607,'apid':_0x3ff3c2[_0x3cfa3c(0x1da,'RW]a')],'ver':$['UA'][_0x3cfa3c(0x276,'K6XO')](';')[0x2],'cl':_0x3ff3c2[_0x3cfa3c(0x1d7,'wv!o')],'user':$[_0x3cfa3c(0x1aa,'z!Yv')],'code':0x1,'ua':$['UA']};_0x242607=await _0x4dd4af[_0x3cfa3c(0x22c,'S)Be')](_0x50cc5c);let _0x5b7625={'url':JD_API_HOST+'?'+_0x242607,'headers':{'Host':_0x3ff3c2[_0x3cfa3c(0x1f2,'gS6[')],'Accept':_0x3ff3c2[_0x3cfa3c(0x220,']UH3')],'Origin':_0x3ff3c2[_0x3cfa3c(0x1c6,'7Bd]')],'Accept-Encoding':_0x3ff3c2[_0x3cfa3c(0x208,'AqDq')],'User-Agent':$['UA'],'Accept-Language':_0x3ff3c2[_0x3cfa3c(0x1fe,'Iw^Y')],'Referer':_0x3ff3c2[_0x3cfa3c(0x1a4,'nry2')],'Cookie':cookie},'timeout':0x7530};return new Promise(_0x17757d=>{const _0x41540a=_0x3cfa3c,_0x1baa62={'vmdIU':function(_0x56782d,_0x51a8eb){const _0x27b8ac=_0x3071;return _0x3ff3c2[_0x27b8ac(0x1d2,'4Z(1')](_0x56782d,_0x51a8eb);},'FxJul':_0x3ff3c2[_0x41540a(0x213,'qpur')],'tEISt':_0x3ff3c2[_0x41540a(0x1d6,'GDgt')],'PbsKo':function(_0x5a8aac,_0x5d5b31){const _0x2b0bc1=_0x41540a;return _0x3ff3c2[_0x2b0bc1(0x1b8,'kFTi')](_0x5a8aac,_0x5d5b31);},'niywu':_0x3ff3c2[_0x41540a(0x1fa,'nry2')],'CWSyS':function(_0x516726,_0x1d1802){const _0x2f5b69=_0x41540a;return _0x3ff3c2[_0x2f5b69(0x278,'Iw^Y')](_0x516726,_0x1d1802);},'ftsOc':function(_0x1e8ed5){const _0x3390ab=_0x41540a;return _0x3ff3c2[_0x3390ab(0x287,'GDgt')](_0x1e8ed5);}};_0x3ff3c2[_0x41540a(0x191,'D!Q@')](_0x3ff3c2[_0x41540a(0x183,'kFTi')],_0x3ff3c2[_0x41540a(0x20e,'z!Yv')])?_0x3ff3c2[_0x41540a(0x21a,'BOem')](setTimeout,()=>{const _0x2b5df9=_0x41540a,_0xf6ab59={'nhsbC':_0x3ff3c2[_0x2b5df9(0x20f,'Ai90')]};_0x3ff3c2[_0x2b5df9(0x25f,'7Bd]')](_0x3ff3c2[_0x2b5df9(0x20c,'7Bd]')],_0x3ff3c2[_0x2b5df9(0x188,'z!Yv')])?(!_0x26a7f2&&(_0x3f2bef[_0x2b5df9(0x219,'y8PE')](_0xf6ab59[_0x2b5df9(0x1fb,'q#Xr')]),_0x4cc220[_0x2b5df9(0x170,'01JI')](_0x2406c5[_0x2b5df9(0x1f9,'GSLl')](_0x1be7e5))),_0x181b59=!![]):$[_0x2b5df9(0x1cc,'BOem')](_0x5b7625,(_0x28bfaa,_0xce1045,_0x47197f)=>{const _0x24f815=_0x2b5df9;try{_0x28bfaa?_0x1baa62[_0x24f815(0x21d,'%!mB')](_0x1baa62[_0x24f815(0x1bd,'Ai90')],_0x1baa62[_0x24f815(0x27c,'mTdx')])?_0x109737?(_0x5bfff0[_0x24f815(0x164,'[Tsa')](_0x24f815(0x165,'J8tj')),_0x1e9fe8[_0x24f815(0x1f6,'ELeq')](_0x274846)):(_0x1f3e34=_0x20962e[_0x24f815(0x21b,'01JI')](_0x191540),_0xd9cafd[_0x24f815(0x207,'kFTi')]=_0x183713[_0x24f815(0x1eb,'GDgt')]?.[_0x24f815(0x16b,'mTdx')]||''):(console[_0x24f815(0x26f,'kFTi')](_0x24f815(0x1ce,'Ai90')),$[_0x24f815(0x221,'&m6X')](_0x28bfaa)):(_0x47197f=JSON[_0x24f815(0x25c,'kFTi')](_0x47197f),$[_0x24f815(0x239,'U8pN')]=_0x47197f[_0x24f815(0x26c,'8!5v')]?.[_0x24f815(0x215,'ELeq')]||'');}catch(_0x5d393c){$[_0x24f815(0x262,'8!5v')](_0x5d393c,_0xce1045);}finally{_0x1baa62[_0x24f815(0x251,']UH3')](_0x1baa62[_0x24f815(0x1c7,'eOHl')],_0x1baa62[_0x24f815(0x1d1,'tJk2')])?_0x258608[_0x24f815(0x22a,'tJk2')]=_0x3013a9['rs'][_0x24f815(0x1c8,'wv!o')][_0x24f815(0x18c,'7Bd]')]?!![]:![]:_0x1baa62[_0x24f815(0x1ab,'hiEw')](_0x17757d,_0x47197f);}});},_0x2ad1b0):_0x1baa62[_0x41540a(0x1b9,'nry2')](_0x3f7ebf);});}async function checkplus(){const _0x440b15=_0x41ebac,_0xb427ab={'QjMpb':function(_0x125780,_0xb3a9d){return _0x125780==_0xb3a9d;},'Stsme':function(_0x2c1cd5,_0x3c0c42){return _0x2c1cd5===_0x3c0c42;},'bsdZE':_0x440b15(0x1ca,'Wcss'),'GwXlE':_0x440b15(0x266,'wYoV'),'vipJx':_0x440b15(0x1c1,'7Bd]'),'lhIXv':function(_0x1b2b6f,_0x4c7530){return _0x1b2b6f==_0x4c7530;},'iPtTq':function(_0x5e7cd5){return _0x5e7cd5();},'WLqTe':_0x440b15(0x1cd,'tJk2'),'uPOFS':_0x440b15(0x24f,'w]GV'),'BpXxu':_0x440b15(0x218,'Wcss'),'ODjBH':_0x440b15(0x1de,'7Bd]'),'yaVhC':_0x440b15(0x27a,'4Z(1'),'eTfAN':_0x440b15(0x27d,'qpur'),'pOqbk':_0x440b15(0x19d,'z!Yv')};let _0x1cc36b={'contentType':_0xb427ab[_0x440b15(0x27e,'K6XO')],'qids':_0xb427ab[_0x440b15(0x241,'RW]a')],'checkLevel':0x1},_0x59cd0f={'appId':_0xb427ab[_0x440b15(0x205,'2N!l')],'fn':_0xb427ab[_0x440b15(0x199,'qpur')],'body':_0x1cc36b,'apid':_0xb427ab[_0x440b15(0x178,'GDgt')],'user':$[_0x440b15(0x17c,'F]tC')],'code':0x1,'ua':$['UA']};_0x1cc36b=await _0x2a8597[_0x440b15(0x190,'nry2')](_0x59cd0f);let _0x3fd9df={'url':_0x440b15(0x1a8,'z!Yv'),'body':_0x1cc36b,'headers':{'User-Agent':$['UA'],'Cookie':cookie,'Origin':_0xb427ab[_0x440b15(0x1f4,'UgR]')],'Referer':_0xb427ab[_0x440b15(0x173,'hiEw')]}};return new Promise(async _0x26eca4=>{const _0x548012=_0x440b15,_0x2e3fb4={'cHlRY':function(_0x3ac189,_0x3cf25f){const _0x19df4b=_0x3071;return _0xb427ab[_0x19df4b(0x285,'F]tC')](_0x3ac189,_0x3cf25f);},'bXfkU':function(_0x5ff0b,_0x1c63df){const _0x48e4fc=_0x3071;return _0xb427ab[_0x48e4fc(0x233,'cLtU')](_0x5ff0b,_0x1c63df);},'HVGRU':_0xb427ab[_0x548012(0x1ea,'q#Xr')],'garIe':_0xb427ab[_0x548012(0x17d,'J8tj')],'HOAAF':function(_0x5aaadf,_0x4f0939){const _0x1dc7b4=_0x548012;return _0xb427ab[_0x1dc7b4(0x254,'Iw^Y')](_0x5aaadf,_0x4f0939);},'WwIRl':_0xb427ab[_0x548012(0x273,']UH3')],'RJAoi':function(_0x2e7d36,_0x21f5e5){const _0x1f400c=_0x548012;return _0xb427ab[_0x1f400c(0x1a3,'1eXd')](_0x2e7d36,_0x21f5e5);},'hvRla':function(_0x1fe85e){const _0x2333a8=_0x548012;return _0xb427ab[_0x2333a8(0x19c,'nry2')](_0x1fe85e);}};$[_0x548012(0x25d,'wYoV')](_0x3fd9df,async(_0x13826a,_0x305785,_0x1f3942)=>{const _0x430a2f=_0x548012;if(_0x2e3fb4[_0x430a2f(0x1e2,'y8PE')](_0x2e3fb4[_0x430a2f(0x202,'ELeq')],_0x2e3fb4[_0x430a2f(0x257,'gk9X')]))_0x51adaa[_0x430a2f(0x1f1,'&m6X')](_0x430a2f(0x250,'UgR]')),_0x2c7b33[_0x430a2f(0x19e,'S)Be')](_0x1f9078);else try{if(_0x13826a){if(_0x2e3fb4[_0x430a2f(0x26d,'K6XO')](_0x2e3fb4[_0x430a2f(0x181,'%!mB')],_0x2e3fb4[_0x430a2f(0x21f,'7oy1')]))console[_0x430a2f(0x16e,'ELeq')](''+JSON[_0x430a2f(0x27b,'01JI')](_0x13826a)),console[_0x430a2f(0x258,'mTdx')](_0x430a2f(0x18a,'mTdx'));else{const _0x3c02f8=_0xb9949d[_0x430a2f(0x167,'eOHl')](_0xd640c0);_0x2e3fb4[_0x430a2f(0x240,'qpur')](_0x3c02f8[_0x430a2f(0x1b7,'Iw^Y')],0x3e8)&&(_0xe8302f[_0x430a2f(0x1c5,'wYoV')]=_0x3c02f8['rs'][_0x430a2f(0x1ae,'mTdx')][_0x430a2f(0x271,'01JI')]);}}else{_0x1f3942=JSON[_0x430a2f(0x236,'GDgt')](_0x1f3942);if(_0x2e3fb4[_0x430a2f(0x197,'gS6[')](_0x1f3942[_0x430a2f(0x1ee,'eOHl')],0x1a1b98))$[_0x430a2f(0x21c,'S)Be')]=_0x1f3942['rs'][_0x430a2f(0x1e9,'wYoV')][_0x430a2f(0x1b1,'cLtU')]?!![]:![];else{}}}catch(_0x217c6e){$[_0x430a2f(0x232,'RW]a')](_0x217c6e,_0x305785);}finally{_0x2e3fb4[_0x430a2f(0x1f7,'gk9X')](_0x26eca4);}});});}var version_ = 'jsjiami.com.v7';
function Env(t, e) {
    "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0);
    class s {
        constructor(t) {
            this.env = t
        }
        send(t, e = "GET") {
            t = "string" == typeof t ? {
                url: t
            }
                : t;
            let s = this.get;
            return "POST" === e && (s = this.post),
                new Promise((e, i) => {
                    s.call(this, t, (t, s, r) => {
                        t ? i(t) : e(s)
                    })
                })
        }
        get(t) {
            return this.send.call(this.env, t)
        }
        post(t) {
            return this.send.call(this.env, t, "POST")
        }
    }
    return new class {
        constructor(t, e) {
            this.name = t,
                this.http = new s(this),
                this.data = null,
                this.dataFile = "box.dat",
                this.logs = [],
                this.isMute = !1,
                this.isNeedRewrite = !1,
                this.logSeparator = "\n",
                this.startTime = (new Date).getTime(),
                Object.assign(this, e),
                this.log("", `🔔${this.name}, 开始!`)
        }
        isNode() {
            return "undefined" != typeof module && !!module.exports
        }
        isQuanX() {
            return "undefined" != typeof $task
        }
        isSurge() {
            return "undefined" != typeof $httpClient && "undefined" == typeof $loon
        }
        isLoon() {
            return "undefined" != typeof $loon
        }
        toObj(t, e = null) {
            try {
                return JSON.parse(t)
            } catch {
                return e
            }
        }
        toStr(t, e = null) {
            try {
                return JSON.stringify(t)
            } catch {
                return e
            }
        }
        getjson(t, e) {
            let s = e;
            const i = this.getdata(t);
            if (i)
                try {
                    s = JSON.parse(this.getdata(t))
                } catch { }
            return s
        }
        setjson(t, e) {
            try {
                return this.setdata(JSON.stringify(t), e)
            } catch {
                return !1
            }
        }
        getScript(t) {
            return new Promise(e => {
                this.get({
                    url: t
                }, (t, s, i) => e(i))
            })
        }
        runScript(t, e) {
            return new Promise(s => {
                let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
                i = i ? i.replace(/\n/g, "").trim() : i;
                let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
                r = r ? 1 * r : 20,
                    r = e && e.timeout ? e.timeout : r;
                const [o, h] = i.split("@"),
                    n = {
                        url: `http://${h}/v1/scripting/evaluate`,
                        body: {
                            script_text: t,
                            mock_type: "cron",
                            timeout: r
                        },
                        headers: {
                            "X-Key": o,
                            Accept: "*/*"
                        }
                    };
                this.post(n, (t, e, i) => s(i))
            }).catch(t => this.logErr(t))
        }
        loaddata() {
            if (!this.isNode())
                return {}; {
                this.fs = this.fs ? this.fs : require("fs"),
                    this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile),
                    e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t),
                    i = !s && this.fs.existsSync(e);
                if (!s && !i)
                    return {}; {
                    const i = s ? t : e;
                    try {
                        return JSON.parse(this.fs.readFileSync(i))
                    } catch (t) {
                        return {}
                    }
                }
            }
        }
        writedata() {
            if (this.isNode()) {
                this.fs = this.fs ? this.fs : require("fs"),
                    this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile),
                    e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t),
                    i = !s && this.fs.existsSync(e),
                    r = JSON.stringify(this.data);
                s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r)
            }
        }
        lodash_get(t, e, s) {
            const i = e.replace(/\[(\d+)\]/g, ".$1").split(".");
            let r = t;
            for (const t of i)
                if (r = Object(r)[t], void 0 === r)
                    return s;
            return r
        }
        lodash_set(t, e, s) {
            return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t)
        }
        getdata(t) {
            let e = this.getval(t);
            if (/^@/.test(t)) {
                const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t),
                    r = s ? this.getval(s) : "";
                if (r)
                    try {
                        const t = JSON.parse(r);
                        e = t ? this.lodash_get(t, i, "") : e
                    } catch (t) {
                        e = ""
                    }
            }
            return e
        }
        setdata(t, e) {
            let s = !1;
            if (/^@/.test(e)) {
                const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e),
                    o = this.getval(i),
                    h = i ? "null" === o ? null : o || "{}" : "{}";
                try {
                    const e = JSON.parse(h);
                    this.lodash_set(e, r, t),
                        s = this.setval(JSON.stringify(e), i)
                } catch (e) {
                    const o = {};
                    this.lodash_set(o, r, t),
                        s = this.setval(JSON.stringify(o), i)
                }
            } else
                s = this.setval(t, e);
            return s
        }
        getval(t) {
            return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null
        }
        setval(t, e) {
            return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null
        }
        initGotEnv(t) {
            this.got = this.got ? this.got : require("got"),
                this.cktough = this.cktough ? this.cktough : require("tough-cookie"),
                this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar,
                t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))
        }
        get(t, e = (() => { })) {
            t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]),
                this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
                    "X-Surge-Skip-Scripting": !1
                })), $httpClient.get(t, (t, s, i) => {
                    !t && s && (s.body = i, s.statusCode = s.status),
                        e(t, s, i)
                })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
                    hints: !1
                })), $task.fetch(t).then(t => {
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    }, o)
                }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => {
                    try {
                        if (t.headers["set-cookie"]) {
                            const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
                            s && this.ckjar.setCookieSync(s, null),
                                e.cookieJar = this.ckjar
                        }
                    } catch (t) {
                        this.logErr(t)
                    }
                }).then(t => {
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    }, o)
                }, t => {
                    const {
                        message: s,
                        response: i
                    } = t;
                    e(s, i, i && i.body)
                }))
        }
        post(t, e = (() => { })) {
            if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon())
                this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
                    "X-Surge-Skip-Scripting": !1
                })), $httpClient.post(t, (t, s, i) => {
                    !t && s && (s.body = i, s.statusCode = s.status),
                        e(t, s, i)
                });
            else if (this.isQuanX())
                t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
                    hints: !1
                })), $task.fetch(t).then(t => {
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    }, o)
                }, t => e(t));
            else if (this.isNode()) {
                this.initGotEnv(t);
                const {
                    url: s,
                    ...i
                } = t;
                this.got.post(s, i).then(t => {
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    }, o)
                }, t => {
                    const {
                        message: s,
                        response: i
                    } = t;
                    e(s, i, i && i.body)
                })
            }
        }
        time(t, e = null) {
            const s = e ? new Date(e) : new Date;
            let i = {
                "M+": s.getMonth() + 1,
                "d+": s.getDate(),
                "H+": s.getHours(),
                "m+": s.getMinutes(),
                "s+": s.getSeconds(),
                "q+": Math.floor((s.getMonth() + 3) / 3),
                S: s.getMilliseconds()
            };
            /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length)));
            for (let e in i)
                new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length)));
            return t
        }
        msg(e = t, s = "", i = "", r) {
            const o = t => {
                if (!t)
                    return t;
                if ("string" == typeof t)
                    return this.isLoon() ? t : this.isQuanX() ? {
                        "open-url": t
                    }
                        : this.isSurge() ? {
                            url: t
                        }
                            : void 0;
                if ("object" == typeof t) {
                    if (this.isLoon()) {
                        let e = t.openUrl || t.url || t["open-url"],
                            s = t.mediaUrl || t["media-url"];
                        return {
                            openUrl: e,
                            mediaUrl: s
                        }
                    }
                    if (this.isQuanX()) {
                        let e = t["open-url"] || t.url || t.openUrl,
                            s = t["media-url"] || t.mediaUrl;
                        return {
                            "open-url": e,
                            "media-url": s
                        }
                    }
                    if (this.isSurge()) {
                        let e = t.url || t.openUrl || t["open-url"];
                        return {
                            url: e
                        }
                    }
                }
            };
            if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) {
                let t = ["", "==============📣系统通知📣=============="];
                t.push(e),
                    s && t.push(s),
                    i && t.push(i),
                    console.log(t.join("\n")),
                    this.logs = this.logs.concat(t)
            }
        }
        log(...t) {
            t.length > 0 && (this.logs = [...this.logs, ...t]),
                console.log(t.join(this.logSeparator))
        }
        logErr(t, e) {
            const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
            s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t)
        }
        wait(t) {
            return new Promise(e => setTimeout(e, t))
        }
        done(t = {}) {
            const e = (new Date).getTime(),
                s = (e - this.startTime) / 1e3;
            this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`),
                this.log(),
                (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t)
        }
    }
        (t, e)
}