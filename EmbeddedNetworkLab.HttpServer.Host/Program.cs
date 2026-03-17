using EmbeddedNetworkLab.Infrastructure.Services;

var service = new HttpServerService();
service.ServerEventTriggered += (_, msg) => Console.WriteLine(msg);
service.VideoReceived += (_, v) => Console.WriteLine($"[VIDEO] {v.FileName} -> {v.FilePath}");
service.UploadProgressChanged += (_, p) => Console.Write($"\r[PROGRESS] {p.Percent:F1}%   ");

var bindIp = args.Length > 0 ? args[0] : "0.0.0.0";
var httpPort = args.Length > 1 ? int.Parse(args[1]) : 8080;

await service.StartAsync(bindIp, httpPort, false, 0);

var cts = new CancellationTokenSource();
Console.CancelKeyPress += (_, e) =>
{
    e.Cancel = true;
    cts.Cancel();
};

try
{
    await Task.Delay(Timeout.Infinite, cts.Token);
}
catch (OperationCanceledException) { }

await service.StopAsync();
