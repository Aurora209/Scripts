from requests import get, post, put, packages
import requests
from re import findall
from os.path import exists
import json
import os
import sys,re

packages.urllib3.disable_warnings()
from urllib.parse import unquote
"""
cron 57 21,9 * * *	
"""
hadsend=True

def printf(text):
    print(text)
    sys.stdout.flush()
    
def load_send():
    global send
    global hadsend
    cur_path = os.path.abspath(os.path.dirname(__file__))
    sys.path.append(cur_path)
    if os.path.exists(cur_path + "/sendNotify.py"):
        try:
            from sendNotify import send
            hadsend=True
        except:
            printf("加载sendNotify.py的通知服务失败，请检查~")
            hadsend=False
    else:
        printf("加载通知服务失败,缺少sendNotify.py文件")
        hadsend=False
load_send()

signurl="https://api.nolanstore.cc/sign"
if os.environ.get("SIGNURL")!=None:
    if os.environ.get("SIGNURL")!="":
        signurl=os.environ.get("SIGNURL")

def send_notification(title, content,summary):
    # Add your own WxPusher API key here
    api_key = os.environ["WP_APP_TOKEN_ONE"]
    uids= os.environ["WP_APP_MAIN_UID"]
    desp = '''<section style="width: 24rem; max-width: 100%;border:none;border-style:none;margin:2.5rem auto;" id="shifu_imi_57"
    donone="shifuMouseDownPayStyle(&#39;shifu_imi_57&#39;)">
    <section
        style="margin: 0px auto;text-align: left;border: 2px solid #212122;padding: 10px 0px;box-sizing:border-box; width: 100%; display:inline-block;"
        class="ipaiban-bc">
        <section style="margin-top: 1rem; float: left; margin-left: 1rem; margin-left: 1rem; font-size: 1.3rem; font-weight: bold;">
            <p style="margin: 0; color: black">
                texttext
            </p>
        </section>
        <section style="display: block;width: 0;height: 0;clear: both;"></section>
        <section
            style="margin-top:20px; display: inline-block; border-bottom: 1px solid #212122; padding: 4px 20px; box-sizing:border-box;"
            class="ipaiban-bbc">
            <section
                style="width:25px; height:25px; border-radius:50%; background-color:#212122;display:inline-block;line-height: 25px"
                class="ipaiban-bg">
                <p style="text-align:center;font-weight:1000;margin:0">
                    <span style="color: #ffffff;font-size:20px;">📢</span>
                </p>
            </section>
            <section style="display:inline-block;padding-left:10px;vertical-align: top;box-sizing:border-box;">
            </section>
        </section>
        <section style="margin-top:0rem;padding: 0.8rem;box-sizing:border-box;">
            <p style=" line-height: 1.6rem; font-size: 1.1rem; ">
                despdesp
			</p>            
        </section>
    </section>
</section>'''
    desp=desp.replace("texttext",title)
    desp=desp.replace("despdesp" ,content.replace("\n", '<br>'))


    payload = {"appToken": api_key,
                "content": desp,
                "summary": title+"\n"+summary,
                "contentType": 2,
                "uids": [uids]
                }
                    
    # Send the request
    res = requests.post('http://wxpusher.zjiecode.com/api/send/message', json=payload, timeout=15).json()
    if res["code"]==1000:
        printf("WxPusher 发送通知消息成功!")
    else:
        printf(res.text)

def get_sign_wskey():
    body = {
        "fn":"genToken",
        "body":{"url": "https://plogin.m.jd.com/jd-mlogin/static/html/appjmp_blank.html"}
    }
    headers = {"user-agent": "JD4iPhone/167774 (iPhone; iOS 14.6; Scale/2.00)"}
    try:
        url = signurl
        data = post(url, headers=headers, json=body).json()
        sign = data['body']
    except Exception as error:
        print(f"【错误】获取sign、body时：\n{error}\n将使用固定sign、body进行获取cookie")
        sign = "client=apple&clientVersion=10.0.10&uuid=a1e779b4f56e4fd3b51af4b1d3ca3f13&st=1635391223795&sign=a1d6386f9455999594208ba36541ffda&sv=120"
    return sign

def getcookie_wskey(key):
    body = "body=%7B%22to%22%3A%22https%3A//plogin.m.jd.com/jd-mlogin/static/html/appjmp_blank.html%22%7D"
    pin = findall("pin=([^;]*);", key)[0]
    sign = get_sign_wskey()
    url = f"https://api.m.jd.com/client.action?functionId=genToken&{sign}"
    headers = {
        "cookie": key,
        'user-agent': "JD4iPhone/167774 (iPhone; iOS 14.6; Scale/2.00)",
        'accept-language': 'zh-Hans-CN;q=1, en-CN;q=0.9',
        'content-type': 'application/x-www-form-urlencoded;'
    }
    try:
        token = post(url=url, headers=headers, data=body, verify=False).json()['tokenKey']
    except Exception as error:
        print(f"【错误】{unquote(pin)}在获取token时：\n{error}")
        return pin, "False"
    url = 'https://un.m.jd.com/cgi-bin/app/appjmp'
    params = {
        'tokenKey': token,
        'to': 'https://plogin.m.jd.com/cgi-bin/m/thirdapp_auth_page',
        'client_type': 'android',
        'appid': 879,
        'appup_type': 1,
    }
    try:
        res = get(url=url, params=params, verify=False,
                  allow_redirects=False).cookies.get_dict()        
    except Exception as error:
        print(f"【错误】{unquote(pin)}在获取cookie时：\n{error}")
        return "Error"
        
    try:
        if "app_open" in res['pt_key']:
            cookie = f"pt_key={res['pt_key']};pt_pin={res['pt_pin']};"
            return cookie
        else:        
            return ("Error:"+str(res))
    except Exception as error:
        print(f"【错误】{unquote(pin)}在获取cookie时：\n{str(res)}")
        return "Error"


def subcookie(pt_pin, cookie, token ,envtype):
    if envtype=="v4":
        sh = "/jd/config/config.sh"
        with open(sh, "r", encoding="utf-8") as read:
            configs = read.readlines()
        cknums = []
        for config in configs:
            cknum = findall(r'(?<=Cookie)[\d]+(?==")', config)
            if cknum != []:
                m = configs.index(config)
                cknums.append(cknum[0])
                if pt_pin in config:
                    configs[m] = f'Cookie{cknum[0]}="{cookie}"\n'
                    printf(f"更新cookie成功！pt_pin：{pt_pin}")
                    break
            elif "第二区域" in config:
                newcknum = int(cknums[-1]) + 1
                configs.insert(m + 1, f'Cookie{newcknum}="{cookie}"\n')
                printf(f"新增cookie成功！pt_pin：{pt_pin}")
                break
        with open(sh, "w", encoding="utf-8") as write:
            write.write("".join(configs))
    else:        
        if token!="":
            url = 'http://127.0.0.1:5600/api/envs'
            headers = {'Authorization': f'Bearer {token}'}
            body = {
                'searchValue': pt_pin,
                'Authorization': f'Bearer {token}'
            }
            datas = get(url, params=body, headers=headers).json()['data']            
            old = False
            isline=True
            for data in datas:
                if "pt_key" in data['value']:
                    try:
                        body = {"name": "JD_COOKIE", "value": cookie, "_id": data['_id']}
                    except:    
                        body = {"name": "JD_COOKIE", "value": cookie, "id": data['id']}
                        isline=False
                    old = True
                    break
            if old:
                put(url, json=body, headers=headers)
                url = 'http://127.0.0.1:5600/api/envs/enable'
                if isline:
                    body = [body['_id']]
                else:
                    body = [body['id']]
                put(url, json=body, headers=headers)
                printf(f"更新并启用cookie成功！pt_pin：{pt_pin}")
            else:
                body = [{"value": cookie, "name": "JD_COOKIE"}]
                post(url, json=body, headers=headers)
                printf(f"新增cookie成功！pt_pin：{pt_pin}")

def main():
    printf("版本: 20230524")
    printf("说明: 如果用Wxpusher通知需配置WP_APP_TOKEN_ONE和WP_APP_MAIN_UID，其中WP_APP_MAIN_UID是你的Wxpusher UID")
    printf("====================================")
    envtype=""
    config=""
    iswxpusher=False
    if os.path.exists("/ql/config/auth.json"):
        envtype="ql"
        config="/ql/config/auth.json"
    
    if os.path.exists("/ql/data/config/auth.json"):
        config="/ql/data/config/auth.json"
        envtype="newql"
        
    if os.path.exists("/jd/config/config.sh"):
        config="/jd/config/config.sh"
        envtype="v4" 
        
    if config=="":
        printf(f"无法判断使用环境，退出脚本!")
        return 
    printf("Sign服务器:"+signurl)    
    try:
        if os.environ.get("WP_APP_TOKEN_ONE")==None or os.environ.get("WP_APP_MAIN_UID")==None:
            printf('没有配置Wxpusher相关变量,将调用sendNotify.py发送通知')
        else:
            if os.environ.get("WP_APP_TOKEN_ONE")=="" or os.environ.get("WP_APP_MAIN_UID")=="":
                printf('没有配置Wxpusher相关变量,将调用sendNotify.py发送通知')
            else:
                printf('检测到已配置Wxpusher相关变量,将使用Wxpusher发送通知')
                iswxpusher=True
    except:
        iswxpusher=False

    printf("\n===============开始转换JD_WSCK==============")
    resurt=""
    resurt1=""
    resurt2=""
    summary=""

    with open(config, "r", encoding="utf-8") as f1:
        token = json.load(f1)['token']
    url = 'http://127.0.0.1:5600/api/envs'
    headers = {'Authorization': f'Bearer {token}'}
    body = {
        'searchValue': 'JD_WSCK',
        'Authorization': f'Bearer {token}'
    }
    datas = get(url, params=body, headers=headers).json()['data']
    for data in datas:
        if data['status']!=0:
            continue
        key = data['value']
        pin = key.split(";")[0].split("=")[1]
        newpin=pin
        cookie = getcookie_wskey(key)
        
        if re.search('%', pin):
            newpin = unquote(pin, 'utf-8')
            
        if "app_open" in cookie:
            #printf("转换成功:"cookie)     
            orgpin = cookie.split(";")[1].split("=")[1]            
            subcookie(orgpin, cookie, token, envtype)
            resurt1=resurt1+f"pt_pin更新成功：{newpin}\n"
        else:            
            if "fake_" in cookie:
                message = f"pin为{newpin}的wskey过期了！"
                printf(message)
                url = 'http://127.0.0.1:5600/api/envs/disable'
                try:
                    body = [data['_id']]
                except:   
                    body = [data['id']]
                put(url, json=body, headers=headers)                
                printf(f"pin为{newpin}的wskey已禁用")
                resurt2=resurt2+f"pin为{newpin}的wskey已禁用\n"
            else:
                message = f"pin为{newpin}的wskey转换失败！"
                resurt2=resurt2+f"pin为{newpin}的wskey转换失败！\n"

               
    if resurt2!="": 
        resurt="👇👇👇👇👇转换异常👇👇👇👇👇\n"+resurt2+"\n"
        summary="部分CK转换异常"
        
        if resurt1!="": 
            resurt=resurt+"👇👇👇👇👇转换成功👇👇👇👇👇\n"+resurt1
            if summary=="":
                summary="全部转换成功"
                
        if iswxpusher:
            send_notification("JD_WSCK转换结果",resurt,summary)
        else:
            if hadsend:
                send("JD_WSCK转换结果",resurt)
            else:
                printf("没有启用通知!")

if __name__ == '__main__':
    main()