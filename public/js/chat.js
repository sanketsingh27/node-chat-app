const socket =io()

const $msgForm = document.querySelector('#sendMessage-form')
const $msgFormInput = $msgForm.querySelector('input')
const $msgFormButton = $msgForm.querySelector('button')
const $locationBtn = document.querySelector('#send-location')
const $messages = document.getElementById('messages')

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const $locationTemplate = document.getElementById('location-template').innerHTML
const $sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search,{ignoreQueryPrefix:true})


socket.on('message',(message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        username: message.username,
        message: message.message,
        createdAt:moment(message.createdAt).format('h:m a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
})

$msgForm.addEventListener('submit',(e)=>{
    e.preventDefault()

    let message = e.target.elements.message.value;

    $msgFormButton.setAttribute('disabled','disabled')
    
    socket.emit('newMsg',message,(error)=>{
        
        $msgFormButton.removeAttribute('disabled');
        $msgFormInput.value='';
        $msgFormInput.focus();

        if(error){
           return console.log('error',error)
        }

        console.log('the message was delivered')
    })
})

$locationBtn.addEventListener('click',()=>{
    if(! navigator.geolocation){
        return alert('geolocation AOI is not supporteed on your browser please update your web browser!!');
    }

    $locationBtn.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        const {latitude,longitude} = position.coords
        socket.emit('locationMessage',{latitude,longitude},(message)=>{
            console.log(message)
            $locationBtn.removeAttribute('disabled')
        })
        console.log({latitude,longitude})
    })
})

socket.on('locationMessage',(url)=>{
    console.log('we are getting url => ', url)
    const location = Mustache.render($locationTemplate,{
        username:url.username, 
        url:url.url,
        createdAt: moment(url.createdAt).format('h:m a')
    })
    $messages.insertAdjacentHTML('beforeend',location)
})

socket.emit('join',{ username,room },(error)=>{
   if(error){
       alert(error)
       location.href= '/'
   }
})

socket.on('roomData',({room,users})=> {
    const html = Mustache.render($sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html;
})