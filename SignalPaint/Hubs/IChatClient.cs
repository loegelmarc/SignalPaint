using System.Threading.Tasks;

namespace SignalPaint.Hubs
{
  /// <summary>
  /// Hub interface definition
  /// </summary>
  public interface IChatClient
  {
    /// <summary>
    /// Used to send a chat-message
    /// </summary>
    Task ReceiveMessage(string user, string message);

    /// <summary>
    /// Starts drawing
    /// </summary>
    /// <param name="connectionId">ID of the connection</param>
    /// <param name="x">Screen coordinate x</param>
    /// <param name="y">Screen coordinate x</param>
    /// <param name="lineWidth">Line width based on pen/finger pressure if available</param>
    /// <param name="color">Line color</param>
    Task SignalTouchStart(string connectionId, float x, float y, float lineWidth, string color);

    /// <summary>
    /// Continue drawing
    /// </summary>
    /// <param name="connectionId">ID of the connection</param>
    /// <param name="x">Screen coordinate x</param>
    /// <param name="y">Screen coordinate x</param>
    /// <param name="lineWidth">Line width based on pen/finger pressure if available</param>
    Task SignalTouchMove(string connectionId, float x, float y, float lineWidth);

    /// <summary>
    /// Finish drawing
    /// </summary>
    /// <param name="connectionId">ID of the connection</param>
    /// <param name="x">Screen coordinate x</param>
    /// <param name="y">Screen coordinate x</param>
    Task SignalTouchEnd(string connectionId, float x, float y);

    /// <summary>
    /// Clear the canvas
    /// </summary>
    /// <param name="connectionId">ID of the connection</param>
    Task SignalClearScreen(string connectionId);

    /// <summary>
    /// Notify that a client hast disconnected
    /// </summary>
    /// <param name="connectionId">ID of the connection</param>
    Task SignalDisconnected(string connectionId);


    ///// <summary>
    ///// Creates a new room
    ///// </summary>
    ///// <returns>Returns the ID of the newly created room to the caller</returns>
    //Task SignalCreateNewRoom();

    /// <summary>
    /// Moves the current connection to the specified room
    /// </summary>
    /// <param name="roomId">ID of the room</param>
    Task SignalJoinedRoom(string roomId);

  }
}
