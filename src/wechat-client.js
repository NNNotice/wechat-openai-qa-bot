import * as io from 'socket.io-client'
const socket = io.connect("http://localhost:3001");

console.debug(socket)

const serverChatId = 'xiaop'

const configData = {
    socket: socket,
    chatInfoEn: {
        chatState: 'agent', // chat状态；robot 机器人、agent 客服
        inputContent: '', // 输入框内容
        msgList: [], // 消息列表
        state: 'on', // 连接状态;on ：在线；off：离线
        lastMsgShowTime: null // 最后一个消息的显示时间
    }, // 会话信息，包括聊天记录、状态
    clientChatEn: {
        clientChatId: '1234567899999999999999',
        clientChatName: '王五',
        avatarUrl: 'static/image/im_client_avatar.png'
    }, // 当前账号的信息
    serverChatEn: {
        serverChatName: '小P',
        avatarUrl: 'static/image/im_robot_avatar.png'
    }, // 服务端chat信息
    robotEn: {
        robotName: '小旺',
        avatarUrl: 'static/image/im_robot_avatar.png'
    }, // 机器人信息
    faqList: [
        { title: '今天周几', content: '今天周一' },
        { title: '今天周几', content: '今天周二' },
        { title: '今天周几', content: '今天周三' },
        { title: '今天周几', content: '今天周四' },
        { title: '今天周几', content: '今天周五' }
    ],
    faqSelected: '-1',
    inputContent_setTimeout: null, // 输入文字时在输入结束才修改具体内容
    selectionRange: null, // 输入框选中的区域
    shortcutMsgList: [], // 聊天区域的快捷回复列表
    logoutDialogVisible: false, // 结束会话显示
    transferDialogVisible: false, // 转接人工dialog
    rateDialogVisible: false, // 评价dialog
    leaveDialogVisible: false // 留言dialog
};

socket.on('connect', () => {
console.debug('connect on...')
    // 客户端上线
    socket.emit('CLIENT_ON', {
        clientChatEn: configData.clientChatEn,
        serverChatId: serverChatId
    });

    // 服务端链接
    socket.on('SERVER_CONNECTED', (data) => {
        // 1)获取客服消息
        configData.serverChatEn = data.serverChatEn;

        // 2)添加消息
        addChatMsg({
            role: 'sys',
            contentType: 'text',
            content: '客服 ' + configData.serverChatEn.serverChatName + ' 为你服务'
        });
    });

    // 接受服务端信息
    socket.on('SERVER_SEND_MSG', (data) => {
        console.debug(data)
        if (data.msg && data.msg.role == 'server') {
            data.msg.role = 'client'
            sendMsg(data)
        }

        // configData.msg.avatarUrl = data.serverChatEn.avatarUrl;
    });
});

socket.on("disconnect", () => {
    console.log(socket.id); // undefined
  });

socket.on("connect_error", (e) => {
    console.error(e)
    // setTimeout(() => {
    //   socket.connect();
    // }, 1000);
  });

// socket.connect()

/**
 * 添加chat对象的msg
 * @param {Object} msg 消息对象；eg：{role:'sys',content:'含有新的消息'}
 * @param {String} msg.role 消息所有者身份；eg：'sys'系统消息；
 * @param {String} msg.contentType 消息类型；text:文本(默认)；image:图片
 * @param {String} msg.content 消息内容
 * @param {Function} successCallback 添加消息后的回调
 */
function addChatMsg(msg, successCallback) {
    // 1.设定默认值
    msg.role = msg.role == undefined ? 'sys' : msg.role;
    msg.contentType = msg.contentType == undefined ? 'text' : msg.contentType;
    msg.createTime = msg.createTime == undefined ? new Date() : msg.createTime;

    var msgList = configData.chatInfoEn.msgList ? configData.chatInfoEn.msgList : [];

    // 2.插入消息
    // 1)插入日期
    // 实际场景中，在消息上方是否显示时间是由后台传递给前台的消息中附加上的，可参考 微信Web版
    // 此处进行手动设置，5分钟之内的消息，只显示一次消息
    msg.createTime = new Date(msg.createTime);
    if (configData.chatInfoEn.lastMsgShowTime == null || msg.createTime.getTime() - configData.chatInfoEn.lastMsgShowTime.getTime() > 1000 * 60 * 5) {
        msgList.push({
            role: 'sys',
            contentType: 'text',
            content: '2022-5-30 20:00:00'
        });
        configData.chatInfoEn.lastMsgShowTime = msg.createTime;
    }

    // 2)插入消息
    msgList.push(msg);

    // 3.设置chat对象相关属性
    configData.chatInfoEn.msgList = msgList;

    // 4.回调
    successCallback && successCallback();
}

/**
 * 发送消息
 * @param {Object} rs 回调对象
 */
function sendMsg(rs) {
    var msg = rs.msg;
    msg.role = 'client';
    msg.avatarUrl = configData.clientChatEn.avatarUrl;
    if (configData.chatInfoEn.chatState == 'robot') {
        // 机器人发送接口
    } else if (configData.chatInfoEn.chatState == 'agent') {
        // 客服接口
        configData.socket.emit('CLIENT_SEND_MSG', {
            serverChatId: configData.serverChatEn.serverChatId,
            clientChatEn: configData.clientChatEn,
            msg: msg
        });

        console.debug(configData.serverChatEn.serverChatId)
    }
    // 2.添加到消息集合李
    addChatMsg(msg);
}

