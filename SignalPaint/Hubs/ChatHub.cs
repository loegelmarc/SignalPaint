using System;
using System.Collections.Concurrent;
using System.Linq;
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
    private static readonly ConcurrentDictionary<string, string> ConnectionsInRooms = new ConcurrentDictionary<string, string>();

    private static string CreateRoomId()
    {
      string roomId;
      do
      {
        roomId = Guid.NewGuid().ToString().Split('-', StringSplitOptions.RemoveEmptyEntries).First();
      } while (ConnectionsInRooms.Values.Contains(roomId));
      return roomId;
    }

    private async Task JoinRoom(string roomId)
    {
      var id = Context.ConnectionId;
      ConnectionsInRooms.AddOrUpdate(id, roomId, (key, oldValue) =>
      {
        Groups.RemoveFromGroupAsync(id, oldValue).GetAwaiter().GetResult();
        return roomId;
      });
      await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
    }

    private string GetUserRoom()
    {
      var hasValue = ConnectionsInRooms.TryGetValue(Context.ConnectionId, out var roomId);
      return hasValue ? roomId : string.Empty;
    }

    /// <summary>
    /// Sends a chat message
    /// </summary>
    /// <param name="user">The shown username</param>
    /// <param name="message">The chat message</param>
    /// <returns></returns>
    public async Task SendMessage(string user, string message)
    {
      //await Clients.All.ReceiveMessage(user, message);
      await Clients.Group(GetUserRoom()).ReceiveMessage(user, message);
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
      //await Clients.All.SignalTouchStart(Context.ConnectionId, x, y, lineWidth, color);
      await Clients.Group(GetUserRoom()).SignalTouchStart(Context.ConnectionId, x, y, lineWidth, color);
    }

    /// <summary>
    /// Continue drawing
    /// </summary>
    /// <param name="x">Screen coordinate x</param>
    /// <param name="y">Screen coordinate x</param>
    /// <param name="lineWidth">Line width based on pen/finger pressure if available</param>
    public async Task SignalTouchMove(float x, float y, float lineWidth)
    {
      //await Clients.All.SignalTouchMove(Context.ConnectionId, x, y, lineWidth);
      await Clients.Group(GetUserRoom()).SignalTouchMove(Context.ConnectionId, x, y, lineWidth);
    }

    /// <summary>
    /// Finish drawing
    /// </summary>
    /// <param name="x">Screen coordinate x</param>
    /// <param name="y">Screen coordinate x</param>
    public async Task SignalTouchEnd(float x, float y)
    {
      //await Clients.All.SignalTouchEnd(Context.ConnectionId, x, y);
      await Clients.Group(GetUserRoom()).SignalTouchEnd(Context.ConnectionId, x, y);
    }

    /// <summary>
    /// Clear the canvas
    /// </summary>
    /// <returns></returns>
    public async Task SignalClearScreen()
    {
      //await Clients.All.SignalClearScreen(Context.ConnectionId);
      await Clients.Group(GetUserRoom()).SignalClearScreen(Context.ConnectionId);
    }

    /// <summary>
    /// Creates a new room
    /// </summary>
    /// <returns>Returns the id of the created room</returns>
    public async Task SignalCreateNewRoom()
    {
      var roomId = CreateRoomId();
      await JoinRoom(roomId);
      await Clients.Caller.SignalJoinedRoom(roomId);
    }

    public async Task SignalJoinRoom(string roomId)
    {
      await JoinRoom(roomId);
      await Clients.Caller.SignalJoinedRoom(roomId);
    }


    public override async Task OnDisconnectedAsync(Exception exception)
    {
      // Add your own code here.
      // For example: in a chat application, mark the user as offline, 
      // delete the association between the current connection id and user name.
      await Clients.All.SignalDisconnected(Context.ConnectionId);

      ConnectionsInRooms.TryRemove(Context.ConnectionId, out var roomId);
      await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);

      await base.OnDisconnectedAsync(exception);
    }

  }
}
