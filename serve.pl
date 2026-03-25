use strict;
use IO::Socket::INET;

my $root = 'C:/Users/COMMU/Desktop/codex/.claude/worktrees/naughty-curie';
my $port = $ENV{PORT} || 5173;

my %mime = (
    html => 'text/html; charset=utf-8',
    css  => 'text/css',
    js   => 'application/javascript',
    png  => 'image/png',
    jpg  => 'image/jpeg',
    ico  => 'image/x-icon',
);

my $server = IO::Socket::INET->new(
    LocalPort => $port,
    Proto     => 'tcp',
    Listen    => 20,
    ReuseAddr => 1,
) or die "Cannot bind: $!";

print "Serving on http://localhost:$port\n";
$| = 1;

while (1) {
    my $client = $server->accept() or next;

    my $pid = fork();
    if (!defined $pid) { close $client; next; }
    if ($pid) { close $client; next; }  # parent

    # child
    close $server;
    handle($client);
    close $client;
    exit 0;
}

sub handle {
    my ($client) = @_;
    my $req = <$client> // return;
    my $hdr;
    while (defined($hdr = <$client>) && $hdr =~ /\S/) {}

    my ($method, $path) = ($req =~ m{^(\w+)\s+(/[^\s]*)\s});
    $path //= '/';
    $path =~ s/\?.*//;
    $path = '/index.html' if $path eq '/';

    my $file = $root . $path;
    $file =~ s{/}{\\}g;

    if (-f $file) {
        my ($ext) = ($file =~ /\.(\w+)$/);
        my $ct = $mime{lc($ext // '')} // 'application/octet-stream';
        open my $fh, '<:raw', $file or do {
            print $client "HTTP/1.1 500 Error\r\nContent-Length: 5\r\n\r\nError";
            return;
        };
        local $/; my $data = <$fh>; close $fh;
        print $client "HTTP/1.1 200 OK\r\nContent-Type: $ct\r\nContent-Length: " . length($data) . "\r\nConnection: close\r\n\r\n$data";
    } else {
        print $client "HTTP/1.1 404 Not Found\r\nContent-Length: 9\r\nConnection: close\r\n\r\nNot Found";
    }
}
