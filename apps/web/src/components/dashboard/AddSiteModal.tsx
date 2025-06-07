import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../ui/toast';

// Define the form schema with validations
// Define the form schema with validations
const formSchema = z.object({
  name: z.string().min(1, "Site name is required"),
  host: z.string().min(1, "Host is required"),
  port: z.coerce.number().int().min(1).max(65535)
    .or(z.string().regex(/^\d+$/).transform(val => parseInt(val))),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  passive: z.boolean().default(true),
  rootPath: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddSiteModalProps {
  open: boolean;
  onClose: () => void;
  onSiteAdded: () => void;
}

export function AddSiteModal({ open, onClose, onSiteAdded }: AddSiteModalProps) {
  const { user, supabase } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      host: '',
      port: 21,
      username: '',
      password: '',
      passive: true,
      rootPath: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication error",
        description: "Please sign in to add a site",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real implementation, we would store in Supabase
      // Note: In production, you should encrypt sensitive data like passwords
      const { error } = await supabase
        .from('sites')
        .insert({
          user_id: user.id,
          name: data.name,
          host: data.host,
          port: data.port,
          username: data.username,
          password: data.password, // In production, this should be encrypted
          passive: data.passive,
          root_path: data.rootPath || '/',
          status: 'pending', // Initial status
        });

      if (error) throw error;

      toast({
        title: "Site added",
        description: `${data.name} has been added to your sites`,
        variant: "success"
      });
      
      form.reset();
      onSiteAdded();
      onClose();
    } catch (error) {
      console.error('Error adding site:', error);
      toast({
        title: "Failed to add site",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add New FTP Site</DialogTitle>
          <DialogDescription>
            Enter your FTP server details to connect to your website.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Website" {...field} />
                  </FormControl>
                  <FormDescription>
                    A friendly name to identify this site
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Host</FormLabel>
                    <FormControl>
                      <Input placeholder="ftp.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port</FormLabel>
                    <FormControl>
                      <Input placeholder="21" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="passive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Use Passive Mode</FormLabel>
                    <FormDescription>
                      Recommended for most connections
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="rootPath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Root Path (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="/public_html" {...field} />
                  </FormControl>
                  <FormDescription>
                    Starting directory on the server
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Site'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
