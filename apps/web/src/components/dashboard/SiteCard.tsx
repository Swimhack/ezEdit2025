import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ExternalLink, Globe, Server, FileEdit } from 'lucide-react';

interface SiteCardProps {
  id: string;
  name: string;
  host: string;
  lastAccessed?: string;
  status: 'online' | 'offline' | 'pending';
  onEdit?: () => void;
}

export function SiteCard({ id, name, host, lastAccessed, status, onEdit }: SiteCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Online</Badge>;
      case 'offline':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-200">Offline</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">Pending</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg border-sky-100 hover:border-sky-300 bg-white">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">{name}</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription className="flex items-center gap-1.5 text-slate-600">
          <Server className="h-3.5 w-3.5 text-blue-500" />
          <span>{host}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-slate-500">
          {lastAccessed && (
            <p className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <span>Last accessed: {lastAccessed}</span>
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onEdit}
          className="border-sky-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600"
        >
          <FileEdit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Link to={`/explorer/${id}`}>
          <Button size="sm" className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white shadow-sm">
            <Globe className="h-4 w-4 mr-2" />
            Open
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
