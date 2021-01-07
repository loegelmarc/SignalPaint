using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace SignalPaint.Hubs
{
  public class ChatHub : Hub<IChatClient>
  {
    public async Task SendMessage(string user, string message)
    {
      await Clients.All.ReceiveMessage(user, message);
    }

    public async Task SignalTouchStart(float x, float y, float lineWidth, string color)
    {
      await Clients.All.SignalTouchStart(Context.ConnectionId, x, y, lineWidth, color);
    }

    public async Task SignalTouchMove(float x, float y, float lineWidth)
    {
      await Clients.All.SignalTouchMove(Context.ConnectionId, x, y, lineWidth);
    }

    public async Task SignalTouchEnd(float x, float y)
    {
      await Clients.All.SignalTouchEnd(Context.ConnectionId, x, y);
    }
    public async Task SignalClearScreen()
    {
      await Clients.All.SignalClearScreen(Context.ConnectionId);
    }
    //public async Task SignalSetColor(string newColor)
    //{
    //  //var x = Context.ConnectionId;
    //  await Clients.All.SignalSetColor(Context.ConnectionId, newColor);//SendAsync("SignalSetColor", Context.ConnectionId, newColor);
    //}

    public override async Task OnDisconnectedAsync(Exception exception)
    {
      await Clients.All.SignalDisconnected(Context.ConnectionId);
      // Add your own code here.
      // For example: in a chat application, mark the user as offline, 
      // delete the association between the current connection id and user name.
      await base.OnDisconnectedAsync(exception);
    }


  }
}
