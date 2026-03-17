namespace EmbeddedNetworkLab.Core.Models
{
	public record UploadProgress(long BytesReceived, long TotalBytes, double Percent);
}
