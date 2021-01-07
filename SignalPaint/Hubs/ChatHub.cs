using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
// ReSharper disable UnusedMember.Global

namespace SignalPaint.Hubs
{
  /// <summary>
  /// Message hub
  /// </summary>
  public class ChatHub : Hub<IChatClient>
  {

    /// <summary>
    /// Sends a chat message
    /// </summary>
    /// <param name="user">The shown username</param>
    /// <param name="message">The chat message</param>
    /// <returns></returns>
    public async Task SendMessage(string user, string message)
    {
      await Clients.All.ReceiveMessage(user, message);
    }

    /// <summary>
    /// Starts drawing
    /// </summary>
    /// <param name="x">Screen coordinate x</param>
    /// <param name="y">Screen coordinate x</param>
    /// <param name="lineWidth">Line width based on pen/finger pressure if available</param>
    /// <param name="color">Line color</param>
    public async Task SignalTouchStart(float x, float y, float lineWidth, string color)
    {
      await Clients.All.SignalTouchStart(Context.ConnectionId, x, y, lineWidth, color);
    }

    /// <summary>
    /// Continue drawing
    /// </summary>
    /// <param name="x">Screen coordinate x</param>
    /// <param name="y">Screen coordinate x</param>
    /// <param name="lineWidth">Line width based on pen/finger pressure if available</param>
    public async Task SignalTouchMove(float x, float y, float lineWidth)
    {
      await Clients.All.SignalTouchMove(Context.ConnectionId, x, y, lineWidth);
    }

    /// <summary>
    /// Finish drawing
    /// </summary>
    /// <param name="x">Screen coordinate x</param>
    /// <param name="y">Screen coordinate x</param>
    public async Task SignalTouchEnd(float x, float y)
    {
      await Clients.All.SignalTouchEnd(Context.ConnectionId, x, y);
    }

    /// <summary>
    /// Clear the canvas
    /// </summary>
    /// <returns></returns>
    public async Task SignalClearScreen()
    {
      await Clients.All.SignalClearScreen(Context.ConnectionId);
    }


    public override async Task OnDisconnectedAsync(Exception exception)
    {
      // Add your own code here.
      // For example: in a chat application, mark the user as offline, 
      // delete the association between the current connection id and user name.
      await Clients.All.SignalDisconnected(Context.ConnectionId);
    
      await base.OnDisconnectedAsync(exception);
    }

  }
}
