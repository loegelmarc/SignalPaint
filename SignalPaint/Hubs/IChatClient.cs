using System.Threading.Tasks;

namespace SignalPaint.Hubs
{
  public interface IChatClient
  {
    Task ReceiveMessage(string user, string message);
    Task SignalTouchStart(string id, float x, float y, float lineWidth, string color);
    Task SignalTouchMove(string id, float x, float y, float lineWidth);
    Task SignalTouchEnd(string id, float x, float y);
    //Task SignalSetColor(string id, string newColor);
    Task SignalClearScreen(string id);
    Task SignalDisconnected(string id);
  }
}
