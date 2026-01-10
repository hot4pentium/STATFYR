import { Layout } from "@/components/layout/Layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ATHLETES } from "@/lib/mockData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, MoreHorizontal, ArrowLeft, Copy, Check, QrCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { useUser } from "@/lib/userContext";
import { useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function RosterPage() {
  const { currentTeam } = useUser();
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const teamCode = currentTeam?.code || "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(teamCode);
    setCopied(true);
    toast.success("Team code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3 md:gap-4 mb-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-display font-bold uppercase tracking-tight text-foreground">Team Roster</h1>
            <p className="text-muted-foreground">Manage your squad, track availability and performance.</p>
          </div>
          <Button size="lg" className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-5 w-5" />
            Add Athlete
          </Button>
        </div>

        {teamCode && (
          <Card className="bg-card border-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Invite Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">Share this code with athletes and supporters to join your team:</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xl px-4 py-2 tracking-wider">
                      {teamCode}
                    </Badge>
                    <Button variant="outline" size="icon" onClick={copyToClipboard} data-testid="button-copy-team-code">
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setShowQRModal(true)} data-testid="button-show-qr">
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card border-white/5">
          <CardHeader className="p-4 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search athlete..." className="pl-9 bg-background/50 border-white/10 focus:border-primary/50" />
              </div>
              <Button variant="outline" size="icon" className="border-white/10 hover:bg-white/5">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-white/5 hover:bg-white/5">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-[80px] text-center">#</TableHead>
                  <TableHead>Athlete</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Goals</TableHead>
                  <TableHead className="text-right">Assists</TableHead>
                  <TableHead className="text-right">Games</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ATHLETES.map((athlete) => (
                  <TableRow key={athlete.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                    <TableCell className="font-display text-xl font-bold text-muted-foreground text-center group-hover:text-primary transition-colors">
                      {athlete.number}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-white/10">
                          <AvatarImage src={athlete.avatar} />
                          <AvatarFallback>{athlete.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{athlete.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{athlete.position}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          athlete.status === 'Active' 
                            ? "bg-green-500/10 text-green-500 border-green-500/20" 
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }
                      >
                        {athlete.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{athlete.stats.goals || '-'}</TableCell>
                    <TableCell className="text-right font-mono">{athlete.stats.assists || '-'}</TableCell>
                    <TableCell className="text-right font-mono">{athlete.stats.games}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">Scan to Join Team</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {teamCode && (
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG 
                  value={`${window.location.origin}/join?code=${teamCode}`}
                  size={200}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              Athletes and supporters can scan this code to join <span className="font-bold">{currentTeam?.name}</span>
            </p>
            <Badge variant="outline" className="font-mono text-lg px-4 py-2">
              {teamCode}
            </Badge>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
